import { notFound } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Header from "@/components/Header";
import DetailActions from "@/components/DetailActions";
import ImageViewer from "@/components/ImageViewer";
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
    safeColors.length > 0 ? safeColors : [{ color: "default", images: [saree.tileImage] }];
  const detailImageUrls = Array.from(new Set(normalizedColors.flatMap((entry) => entry.images)));

  return (
    <Box className="app-shell-bg" sx={{ minHeight: "100vh", pb: 6 }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 4 } }}>
        <Button
          component="a"
          href="/"
          startIcon={<ArrowBackRoundedIcon />}
          sx={{ mb: 2 }}
        >
          Back to Gallery
        </Button>

        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 4 }}>
          <Box sx={{ flex: 1.6 }}>
            <ImageViewer colors={normalizedColors} imageText={safeImageText} />
          </Box>

          <Box
            sx={{
              flex: 1,
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              bgcolor: "background.paper",
              border: "1px solid rgba(139, 30, 63, 0.1)",
              boxShadow: "0 16px 34px rgba(74, 35, 46, 0.08)",
            }}
          >
            <Typography
              variant="h4"
              sx={{ fontSize: { xs: "1.55rem", sm: "2rem" }, overflowWrap: "anywhere", lineHeight: 1.15 }}
            >
              {safeName}
            </Typography>
            <Typography variant="h5" color="primary" sx={{ mt: 1.5, fontSize: { xs: "1.35rem", sm: "1.6rem" } }}>
              Rs. {safePrice.toLocaleString("en-IN")}
            </Typography>

            <Chip
              label={safeStatus === "available" ? "Available" : "Sold Out"}
              color={safeStatus === "available" ? "success" : "error"}
              sx={{ mt: 2, fontWeight: 600 }}
            />
            <DetailActions itemName={safeName} imageUrls={detailImageUrls} />

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6">Color Variants</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
              {normalizedColors.map((entry) => (
                <Chip
                  key={entry.color}
                  label={`${entry.color} (${entry.images.length})`}
                  sx={{
                    maxWidth: "100%",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
