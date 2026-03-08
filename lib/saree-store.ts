import path from "path";
import { del, put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { SareeItem, SareeStatus } from "@/types/saree";

// data access --------------------------------------------------------------
import { getDb } from "@/lib/mongodb";

export function normalizeBlobUrl(url: string): string {
  return url.replace(".private.blob.vercel-storage.com", ".public.blob.vercel-storage.com");
}

function normalizeSareeUrls(item: SareeItem): SareeItem {
  return {
    ...item,
    tileImage: normalizeBlobUrl(item.tileImage),
    colors: Array.isArray(item.colors)
      ? item.colors.map((entry) => ({
          ...entry,
          images: Array.isArray(entry.images) ? entry.images.map((img) => normalizeBlobUrl(img)) : [],
        }))
      : [],
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

export function normalizeStatus(input: string | null | undefined): SareeStatus {
  return input === "sold_out" ? "sold_out" : "available";
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
        if (imageUrl) {
          urls.add(imageUrl);
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
