import { NextResponse } from "next/server";
import { ensureAdminSession } from "@/lib/admin-auth";
import {
  makeId,
  normalizeStatus,
  readSarees,
  saveUploadedFile,
  writeSarees,
} from "@/lib/saree-store";
import { SareeItem } from "@/types/saree";

export async function GET() {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) return unauthorized;

  const sarees = await readSarees();
  return NextResponse.json(sarees);
}

export async function POST(request: Request) {
  const unauthorized = await ensureAdminSession();
  if (unauthorized) return unauthorized;

  const formData = await request.formData();
  const name = (formData.get("name") as string | null)?.trim();
  const imageText = (formData.get("imageText") as string | null)?.trim() ?? "";
  const price = Number(formData.get("price"));
  const status = normalizeStatus(formData.get("status") as string | null);
  const color = ((formData.get("color") as string | null) ?? "default").trim() || "default";
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

  const uploadedTileImage = await saveUploadedFile(tileImageFile);
  const uploadedGalleryImages = (
    await Promise.all(galleryImages.map((file) => saveUploadedFile(file)))
  ).filter((value): value is string => Boolean(value));

  const tileImage = uploadedTileImage ?? uploadedGalleryImages[0];
  if (!tileImage) {
    return NextResponse.json(
      { message: "Provide at least one tile or gallery image." },
      { status: 400 }
    );
  }

  const newSaree: SareeItem = {
    id: makeId(),
    name,
    imageText: imageText || name,
    price,
    status,
    tileImage,
    colors: [
      {
        color,
        images: uploadedGalleryImages.length > 0 ? uploadedGalleryImages : [tileImage],
      },
    ],
  };

  const sarees = await readSarees();
  sarees.unshift(newSaree);
  await writeSarees(sarees);

  return NextResponse.json(newSaree, { status: 201 });
}
