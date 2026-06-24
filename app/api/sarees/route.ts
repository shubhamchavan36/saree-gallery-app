import { NextResponse } from "next/server";
import { ensureAdminSession } from "@/lib/admin-auth";
import {
  makeId,
  normalizeBlobUrl,
  normalizeStatus,
  readSarees,
  saveUploadedFile,
  writeSarees,
} from "@/lib/saree-store";
import { SareeImage, SareeItem, SareeStatus } from "@/types/saree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function parseNewGalleryStatuses(input: FormDataEntryValue | null): SareeStatus[] {
  if (typeof input !== "string" || !input.trim()) return [];
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "string" ? normalizeStatus(item) : "available"))
      .filter((status): status is SareeStatus => Boolean(status));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const unauthorized = await ensureAdminSession();
    if (unauthorized) return unauthorized;

    const sarees = await readSarees();
    return NextResponse.json(sarees);
  } catch (error) {
    console.error("Error reading sarees:", error);
    return NextResponse.json(
      { message: "Failed to read sarees. Verify AWS/LocalStack env configuration." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const name = (formData.get("name") as string | null)?.trim();
    const imageText = (formData.get("imageText") as string | null)?.trim() ?? "";
    const price = Number(formData.get("price"));
    const status = normalizeStatus(formData.get("status") as string | null);
    const color = ((formData.get("color") as string | null) ?? "default").trim() || "default";
    const description = (formData.get("description") as string | null)?.trim() ?? "";
    const tileImageUrl = (formData.get("tileImageUrl") as string | null)?.trim();
    const galleryImageStatusMap = parseGalleryImageStatusMap(formData.get("galleryImageStatusMap"));
    const newGalleryStatuses = parseNewGalleryStatuses(formData.get("newGalleryStatuses"));
    const galleryImageUrls = formData
      .getAll("galleryImageUrls")
      .filter((entry): entry is string => typeof entry === "string")
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url) => normalizeBlobUrl(url));
    const tileImageFile = formData.get("tileImage") as File | null;
    const galleryImages = formData
      .getAll("galleryImages")
      .filter((entry): entry is File => entry instanceof File);

    if (!name || Number.isNaN(price) || price < 0) {
      return NextResponse.json(
        { message: "Name and valid price are required." },
        { status: 400 }
      );
    }

    const uploadedTileImage = tileImageUrl ? normalizeBlobUrl(tileImageUrl) : await saveUploadedFile(tileImageFile, "tile");
    const uploadedGalleryImages = (
      await Promise.all(galleryImages.map((file) => saveUploadedFile(file, "gallery")))
    ).filter((value): value is string => Boolean(value));

    const tileImage = uploadedTileImage ?? galleryImageUrls[0] ?? uploadedGalleryImages[0];
    if (!tileImage) {
      return NextResponse.json(
        { message: "Provide at least one tile or gallery image." },
        { status: 400 }
      );
    }

    const normalizedTileImage = normalizeBlobUrl(tileImage);
    const normalizedExistingGalleryImageUrls = Array.from(
      new Set(galleryImageUrls.map((url) => normalizeBlobUrl(url)))
    ).filter((url) => url !== normalizedTileImage);
    const normalizedUploadedGalleryImageUrls = Array.from(
      new Set(uploadedGalleryImages.map((url) => normalizeBlobUrl(url)))
    ).filter((url) => url !== normalizedTileImage);

    const galleryImageEntries: SareeImage[] = [
      ...normalizedExistingGalleryImageUrls.map((url) => ({
        url,
        status: galleryImageStatusMap[url] ?? status,
      })),
      ...normalizedUploadedGalleryImageUrls.map((url, index) => ({
        url,
        status: newGalleryStatuses[index] ?? status,
      })),
    ];

    const now = new Date().toISOString();
    const newSaree: SareeItem = {
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      name,
      imageText: imageText || name,
      price,
      status,
      tileImage,
      colors: [
        {
          color,
          images: galleryImageEntries,
        },
      ],
      description,
    };

    const sarees = await readSarees();
    sarees.unshift(newSaree);
    await writeSarees(sarees);

    return NextResponse.json(newSaree, { status: 201 });
  } catch (error) {
    console.error("Error creating saree:", error);
    return NextResponse.json(
      { message: "Internal server error occurred while creating saree." },
      { status: 500 }
    );
  }
}
