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
import { SareeItem } from "@/types/saree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const unauthorized = await ensureAdminSession();
    if (unauthorized) return unauthorized;

    const sarees = await readSarees();
    return NextResponse.json(sarees);
  } catch (error) {
    console.error("Error reading sarees:", error);
    return NextResponse.json(
      { message: "Failed to read sarees. Verify MongoDB env configuration." },
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

    const uploadedTileImage = tileImageUrl ? normalizeBlobUrl(tileImageUrl) : await saveUploadedFile(tileImageFile);
    const uploadedGalleryImages = (
      await Promise.all(galleryImages.map((file) => saveUploadedFile(file)))
    ).filter((value): value is string => Boolean(value));
    const allGalleryImages = [...galleryImageUrls, ...uploadedGalleryImages];

    const tileImage = uploadedTileImage ?? allGalleryImages[0];
    if (!tileImage) {
      return NextResponse.json(
        { message: "Provide at least one tile or gallery image." },
        { status: 400 }
      );
    }

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
          images: allGalleryImages.length > 0 ? allGalleryImages : [tileImage],
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
