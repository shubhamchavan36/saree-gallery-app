import path from "path";
import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { SareeImage, SareeItem, SareeStatus } from "@/types/saree";

// data access --------------------------------------------------------------
import { getDb } from "@/lib/mongodb";

export function normalizeBlobUrl(url: string): string {
  return url.replace(".private.blob.vercel-storage.com", ".public.blob.vercel-storage.com");
}

export function normalizeStatus(input: string | null | undefined): SareeStatus {
  return input === "sold_out" ? "sold_out" : "available";
}

function normalizeSareeImage(input: unknown): SareeImage | null {
  if (typeof input === "string" && input.trim()) {
    return { url: normalizeBlobUrl(input.trim()), status: "available" };
  }

  if (input && typeof input === "object") {
    const maybe = input as { url?: unknown; status?: unknown };
    if (typeof maybe.url === "string" && maybe.url.trim()) {
      return {
        url: normalizeBlobUrl(maybe.url.trim()),
        status: normalizeStatus(typeof maybe.status === "string" ? maybe.status : undefined),
      };
    }
  }

  return null;
}

function normalizeSareeUrls(item: SareeItem): SareeItem {
  const tileImage = normalizeBlobUrl(item.tileImage);
  const colors = Array.isArray(item.colors)
    ? item.colors.map((entry) => {
        const normalizedImages = Array.isArray(entry.images)
          ? entry.images
              .map((img) => normalizeSareeImage(img))
              .filter((img): img is SareeImage => Boolean(img))
          : [];

        const seen = new Set<string>();
        const images = normalizedImages
          .filter((img) => normalizeBlobUrl(img.url) !== tileImage)
          .filter((img) => {
            const key = normalizeBlobUrl(img.url);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        return { ...entry, images };
      })
    : [];

  return {
    ...item,
    tileImage,
    colors,
  };
}

export async function readSarees(): Promise<SareeItem[]> {
  const db = await getDb();
  const coll = db.collection<SareeItem>("sarees");
  const docs = await coll.find({}).toArray();
  // Convert MongoDB documents to plain objects
  return docs.map((doc) =>
    normalizeSareeUrls({
    id: doc.id,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    name: doc.name,
    imageText: doc.imageText,
    price: doc.price,
    status: doc.status,
    tileImage: doc.tileImage,
    colors: doc.colors,
    description: doc.description,
    })
  );
}

export async function writeSarees(sarees: SareeItem[]) {
  const db = await getDb();
  const coll = db.collection<SareeItem>("sarees");
  await coll.deleteMany({});
  if (sarees.length) {
    await coll.insertMany(sarees.map((s) => normalizeSareeUrls(s)));
  }
}

export function makeId() {
  return randomUUID();
}

export async function saveUploadedFile(file: File | null): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const ext = path.extname(file.name) || ".jpg";
  const base = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();
  const filename = `${base}-${Date.now()}${ext}`;

  try {
    // Upload to Vercel Blob instead of local filesystem
    const blob = await put(filename, file, { access: "public" });
    return normalizeBlobUrl(blob.url);
  } catch (error) {
    console.error("Blob upload error:", error);
    throw error; // Re-throw to let API handle it
  }
}

export function getSareeBlobUrls(item: SareeItem): string[] {
  const urls = new Set<string>();
  if (item.tileImage) {
    urls.add(item.tileImage);
  }

  if (Array.isArray(item.colors)) {
    item.colors.forEach((entry) => {
      entry.images.forEach((imageUrl) => {
        if (imageUrl?.url) {
          urls.add(imageUrl.url);
        }
      });
    });
  }

  return Array.from(urls);
}

export async function deleteBlobUrls(urls: string[]): Promise<void> {
  if (urls.length === 0) return;
  await del(urls);
}
