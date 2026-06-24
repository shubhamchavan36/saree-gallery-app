import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import Header from "@/components/Header";
import SareeDetailClient from "@/components/SareeDetailClient";
import { readSarees } from "@/lib/saree-store";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await Promise.resolve(params);
  const sarees = await readSarees();
  const saree = sarees.find((item) => item.id === id);

  if (!saree) return {};

  const safeName = typeof saree.name === "string" && saree.name.trim() ? saree.name : "Untitled Saree";
  const safeImageText =
    typeof saree.imageText === "string" && saree.imageText.trim()
      ? saree.imageText.trim()
      : safeName;
  const safePrice = typeof saree.price === "number" && Number.isFinite(saree.price) ? `₹${saree.price}` : "Contact for price";
  
  // Get the first gallery image for OG image
  const galleryImages = Array.isArray(saree.colors) && saree.colors.length > 0
    ? saree.colors
        .filter((entry) => Array.isArray(entry.images) && entry.images.length > 0)
        .flatMap((entry) => entry.images)
    : [];
  
  const ogImage = galleryImages.length > 0 ? galleryImages[0].url : saree.tileImage;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shareUrl = `${baseUrl}/saree/${id}`;
  const ogImageUrl = `${baseUrl}/api/og-image/${id}`;
  const description = `${safeImageText} • ${safePrice}`;

  return {
    title: `${safeName} - Saree Gallery`,
    description: description,
    metadataBase: new URL(baseUrl),
    openGraph: {
      title: safeName,
      description: description,
      type: "website",
      url: shareUrl,
      siteName: "Saree Gallery",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 1200,
          alt: safeName,
          type: "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: safeName,
      description: description,
      images: [ogImageUrl],
    },
  };
}

export default async function SareeDetailPage({ params }: Props) {
  const { id } = await Promise.resolve(params);
  const sarees = await readSarees();
  const saree = sarees.find((item) => item.id === id);

  if (!saree) notFound();
  const safeName = typeof saree.name === "string" && saree.name.trim() ? saree.name : "Untitled Saree";
  const safeImageText =
    typeof saree.imageText === "string" && saree.imageText.trim()
      ? saree.imageText.trim()
      : safeName;
  const safePrice = typeof saree.price === "number" && Number.isFinite(saree.price) ? saree.price : 0;
  const safeStatus = saree.status === "sold_out" ? "sold_out" : "available";
  const safeColors =
    Array.isArray(saree.colors) && saree.colors.length > 0
      ? saree.colors.filter(
          (entry) =>
            typeof entry?.color === "string" &&
            Array.isArray(entry.images) &&
            entry.images.length > 0
        )
      : [];
  const normalizedColors =
    safeColors.length > 0
      ? safeColors
      : [{ color: "default", images: [{ url: saree.tileImage, status: "available" as const }] }];
  const detailImageUrls = Array.from(
    new Set(normalizedColors.flatMap((entry) => entry.images.map((img) => img.url)))
  );

  return (
    <Box className="app-shell-bg" sx={{ minHeight: "100vh", pb: 6 }}>
      <Header />
      <SareeDetailClient
        name={safeName}
        subtitle={safeImageText}
        price={safePrice}
        baseStatus={safeStatus}
        colors={normalizedColors}
        imageUrls={detailImageUrls}
        description={saree.description}
      />
    </Box>
  );
}
