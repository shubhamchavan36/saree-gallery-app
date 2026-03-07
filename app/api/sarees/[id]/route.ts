import { NextResponse } from "next/server";
import { ensureAdminSession } from "@/lib/admin-auth";
import {
  normalizeStatus,
  readSarees,
  saveUploadedFile,
  writeSarees,
} from "@/lib/saree-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

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
    const color = ((formData.get("color") as string | null) ?? "default").trim() || "default";

    const tileImageFile = formData.get("tileImage") as File | null;
    const galleryImages = formData
      .getAll("galleryImages")
      .filter((entry): entry is File => entry instanceof File);

    const uploadedTileImage = await saveUploadedFile(tileImageFile);
    const uploadedGalleryImages = (
      await Promise.all(galleryImages.map((file) => saveUploadedFile(file)))
    ).filter((value): value is string => Boolean(value));

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

    if (uploadedTileImage) {
      nextItem.tileImage = uploadedTileImage;
    }

    if (uploadedGalleryImages.length > 0) {
      const colorIndex = nextItem.colors.findIndex(
        (entry) => entry.color.toLowerCase() === color.toLowerCase()
      );

      if (colorIndex >= 0) {
        nextItem.colors[colorIndex].images = [
          ...nextItem.colors[colorIndex].images,
          ...uploadedGalleryImages,
        ];
      } else {
        nextItem.colors.push({ color, images: uploadedGalleryImages });
      }
    }

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
    const next = sarees.filter((item) => item.id !== id);

    if (next.length === sarees.length) {
      return NextResponse.json({ message: "Saree not found." }, { status: 404 });
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
