import { notFound } from "next/navigation";
import { Box } from "@mui/material";
import Header from "@/components/Header";
import SareeDetailClient from "@/components/SareeDetailClient";
import { readSarees } from "@/lib/saree-store";

export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string } | Promise<{ id: string }>;
};

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
