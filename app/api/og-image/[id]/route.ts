import { readSarees } from "@/lib/saree-store";
import { NextResponse } from "next/server";

export async function GET({ params }: { params: { id: string } }) {
  const sarees = await readSarees();
  const saree = sarees.find((item) => item.id === params.id);

  if (!saree) {
    return NextResponse.json({ message: "Saree not found" }, { status: 404 });
  }

  const galleryImages = Array.isArray(saree.colors) && saree.colors.length > 0
    ? saree.colors
        .filter((entry) => Array.isArray(entry.images) && entry.images.length > 0)
        .flatMap((entry) => entry.images)
    : [];
  const imageUrl = galleryImages.length > 0 ? galleryImages[0].url : saree.tileImage;

  if (!imageUrl) {
    return NextResponse.json({ message: "No preview image available" }, { status: 404 });
  }

  const response = await fetch(imageUrl);
  if (!response.ok) {
    return NextResponse.json({ message: "Unable to fetch image" }, { status: 502 });
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
