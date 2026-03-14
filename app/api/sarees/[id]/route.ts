import { NextResponse } from "next/server";
import { ensureAdminSession } from "@/lib/admin-auth";
import {
  deleteBlobUrls,
  getSareeBlobUrls,
  normalizeBlobUrl,
  normalizeStatus,
  readSarees,
  saveUploadedFile,
  writeSarees,
} from "@/lib/saree-store";
import { SareeStatus } from "@/types/saree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

function parseGalleryImageStatusMap(input: FormDataEntryValue | null): Record<string, SareeStatus> {
  if (typeof input !== "string" || !input.trim()) return {};
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!parsed || typeof parsed !== "object") return {};

    const out: Record<string, SareeStatus> = {};
    for (const [rawUrl, rawStatus] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof rawUrl !== "string" || !rawUrl.trim()) continue;
      const url = normalizeBlobUrl(rawUrl.trim());
      out[url] = normalizeStatus(typeof rawStatus === "string" ? rawStatus : undefined);
    }
    return out;
  } catch {
    return {};
  }
}

export async function GET(_: Request, context: Context) {
  try {
    const unauthorized = await ensureAdminSession();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const sarees = await readSarees();
    const saree = sarees.find((item) => item.id === id);

    if (!saree) {
      return NextResponse.json({ message: "Saree not found." }, { status: 404 });
    }

    return NextResponse.json(saree);
  } catch (error) {
    console.error("Error reading saree by id:", error);
    return NextResponse.json(
      { message: "Failed to read saree. Verify MongoDB env configuration." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    const unauthorized = await ensureAdminSession();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const sarees = await readSarees();
    const index = sarees.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json({ message: "Saree not found." }, { status: 404 });
    }

    const current = sarees[index];
    const formData = await request.formData();

    const nameInput = formData.get("name");
    const imageTextInput = formData.get("imageText");
    const priceInput = formData.get("price");
    const statusInput = formData.get("status");
    const descriptionInput = formData.get("description");
    const color = ((formData.get("color") as string | null) ?? "default").trim() || "default";
    const tileImageUrl = (formData.get("tileImageUrl") as string | null)?.trim();
    const galleryImageStatusMap = parseGalleryImageStatusMap(formData.get("galleryImageStatusMap"));
    const galleryImageUrls = formData
      .getAll("galleryImageUrls")
      .filter((entry): entry is string => typeof entry === "string")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => normalizeBlobUrl(url));
    const removedGalleryImageUrls = Array.from(
      new Set(
        formData
          .getAll("removedGalleryImageUrls")
          .filter((entry): entry is string => typeof entry === "string")
          .map((url) => url.trim())
          .filter(Boolean)
          .map((url) => normalizeBlobUrl(url))
      )
    );

    const tileImageFile = formData.get("tileImage") as File | null;
    const galleryImages = formData
      .getAll("galleryImages")
      .filter((entry): entry is File => entry instanceof File);

    const uploadedTileImage = tileImageUrl ? normalizeBlobUrl(tileImageUrl) : await saveUploadedFile(tileImageFile);
    const uploadedGalleryImages = (
      await Promise.all(galleryImages.map((file) => saveUploadedFile(file)))
    ).filter((value): value is string => Boolean(value));
    const allGalleryImages = [...galleryImageUrls, ...uploadedGalleryImages];

    const nextItem = { ...current };

    if (typeof nameInput === "string" && nameInput.trim()) {
      nextItem.name = nameInput.trim();
    }

    if (typeof imageTextInput === "string") {
      nextItem.imageText = imageTextInput.trim() || nextItem.name;
    }

    if (typeof priceInput === "string" && priceInput.trim()) {
      const parsed = Number(priceInput);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        nextItem.price = parsed;
      }
    }

    if (typeof statusInput === "string") {
      nextItem.status = normalizeStatus(statusInput);
    }

    if (typeof descriptionInput === "string") {
      nextItem.description = descriptionInput.trim();
    }

    if (uploadedTileImage) {
      nextItem.tileImage = uploadedTileImage;
    }

    if (removedGalleryImageUrls.length > 0) {
      const removedSet = new Set(removedGalleryImageUrls);
      nextItem.colors = nextItem.colors
        .map((entry) => ({
          ...entry,
          images: entry.images.filter((image) => !removedSet.has(normalizeBlobUrl(image.url))),
        }))
        .filter((entry) => entry.images.length > 0);
    }

    if (allGalleryImages.length > 0) {
      const colorIndex = nextItem.colors.findIndex(
        (entry) => entry.color.toLowerCase() === color.toLowerCase()
      );

      if (colorIndex >= 0) {
        nextItem.colors[colorIndex].images = [
          ...nextItem.colors[colorIndex].images,
          ...allGalleryImages.map((url) => ({
            url,
            status: galleryImageStatusMap[normalizeBlobUrl(url)] ?? "available",
          })),
        ];
      } else {
        nextItem.colors.push({
          color,
          images: allGalleryImages.map((url) => ({
            url,
            status: galleryImageStatusMap[normalizeBlobUrl(url)] ?? "available",
          })),
        });
      }
    }

    if (Object.keys(galleryImageStatusMap).length > 0) {
      nextItem.colors = nextItem.colors.map((entry) => ({
        ...entry,
        images: entry.images.map((image) => ({
          ...image,
          status: galleryImageStatusMap[normalizeBlobUrl(image.url)] ?? image.status ?? "available",
        })),
      }));
    }

    if (removedGalleryImageUrls.length > 0) {
      if (removedGalleryImageUrls.includes(normalizeBlobUrl(current.tileImage))) {
        const firstGalleryImage = nextItem.colors.flatMap((entry) => entry.images)[0]?.url;
        if (!uploadedTileImage && !firstGalleryImage) {
          return NextResponse.json(
            { message: "Cannot remove the only image. Add another image or set a new tile image." },
            { status: 400 }
          );
        }
        if (!uploadedTileImage && firstGalleryImage) {
          nextItem.tileImage = firstGalleryImage;
        }
      }

      const blobReferences = new Set<string>();
      sarees.forEach((item, sareeIndex) => {
        if (sareeIndex === index) return;
        getSareeBlobUrls(item).forEach((url) => blobReferences.add(normalizeBlobUrl(url)));
      });
      getSareeBlobUrls(nextItem).forEach((url) => blobReferences.add(normalizeBlobUrl(url)));

      const blobUrlsToDelete = removedGalleryImageUrls.filter((url) => !blobReferences.has(url));
      if (blobUrlsToDelete.length > 0) {
        await deleteBlobUrls(blobUrlsToDelete);
      }
    }

    nextItem.updatedAt = new Date().toISOString();

    sarees[index] = nextItem;
    await writeSarees(sarees);
    return NextResponse.json(nextItem);
  } catch (error) {
    console.error("Error updating saree:", error);
    return NextResponse.json(
      { message: "Failed to update saree. Verify env configuration." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    const unauthorized = await ensureAdminSession();
    if (unauthorized) return unauthorized;

    const { id } = await context.params;
    const sarees = await readSarees();
    const current = sarees.find((item) => item.id === id);
    const next = sarees.filter((item) => item.id !== id);

    if (!current || next.length === sarees.length) {
      return NextResponse.json({ message: "Saree not found." }, { status: 404 });
    }

    const blobUrls = getSareeBlobUrls(current);
    try {
      await deleteBlobUrls(blobUrls);
    } catch (blobError) {
      console.error("Error deleting blob files:", blobError);
      return NextResponse.json(
        { message: "Failed to delete saree images from Blob storage." },
        { status: 500 }
      );
    }

    await writeSarees(next);
    return NextResponse.json({ message: "Deleted successfully." });
  } catch (error) {
    console.error("Error deleting saree:", error);
    return NextResponse.json(
      { message: "Failed to delete saree. Verify env configuration." },
      { status: 500 }
    );
  }
}
