"use client";

import { useCallback, useState } from "react";
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
import DetailActions from "@/components/DetailActions";
import ImageViewer, { ImageViewerActiveImageMeta } from "@/components/ImageViewer";
import { SareeColor, SareeStatus } from "@/types/saree";

export default function SareeDetailClient({
  name,
  subtitle,
  price,
  baseStatus,
  colors,
  imageUrls,
  description,
}: {
  name: string;
  subtitle: string;
  price: number;
  baseStatus: SareeStatus;
  colors: SareeColor[];
  imageUrls: string[];
  description?: string;
}) {
  const [activeMeta, setActiveMeta] = useState<ImageViewerActiveImageMeta | null>(null);
  const handleActiveImageChange = useCallback((meta: ImageViewerActiveImageMeta | null) => {
    setActiveMeta(meta);
  }, []);

  const status = activeMeta?.status ?? baseStatus;
  const statusLabel = status === "available" ? "Available" : "Sold Out";
  const statusColor = status === "available" ? "success" : "error";

  const activeLabel = activeMeta
    ? `${activeMeta.color} • ${activeMeta.index + 1}/${activeMeta.total}`
    : null;

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 4 } }}>
      <Button component="a" href="/" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2 }}>
        Back to Gallery
      </Button>

      <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 4 }}>
        <Box sx={{ flex: 1.6 }}>
          <ImageViewer
            colors={colors}
            imageText={subtitle}
            onActiveImageChange={handleActiveImageChange}
          />
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
            sx={{
              fontSize: { xs: "1.55rem", sm: "2rem" },
              overflowWrap: "anywhere",
              lineHeight: 1.15,
            }}
          >
            {name}
          </Typography>

          {subtitle && subtitle !== name && (
            <Typography variant="subtitle1" sx={{ mt: 0.75, color: "text.secondary" }}>
              {subtitle}
            </Typography>
          )}

          {activeLabel && (
            <Typography variant="body2" sx={{ mt: 1.25, color: "text.secondary" }}>
              Viewing: {activeLabel}
            </Typography>
          )}

          <Typography
            variant="h5"
            color="primary"
            sx={{ mt: 1.5, fontSize: { xs: "1.35rem", sm: "1.6rem" } }}
          >
            Rs. {price.toLocaleString("en-IN")}
          </Typography>

          <Chip label={statusLabel} color={statusColor} sx={{ mt: 2, fontWeight: 600 }} />
          <DetailActions itemName={name} imageUrls={imageUrls} />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6">Color Variants</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
            {colors.map((entry) => (
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

          {description && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6">Description</Typography>
              <Typography variant="body1" sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}>
                {description}
              </Typography>
            </>
          )}
        </Box>
      </Stack>
    </Container>
  );
}

