import { Box } from "@mui/material";
import Header from "@/components/Header";
import Carousel from "@/components/Carousel";
import GallerySection from "@/components/GallerySection";
import { readSarees } from "@/lib/saree-store";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const sarees = await readSarees();

  return (
    <Box className="app-shell-bg" sx={{ minHeight: "100vh", pb: 4 }}>
      <Header />
      <Carousel items={sarees} />
      <GallerySection items={sarees} />
    </Box>
  );
}
