"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Box, CircularProgress, IconButton, Stack, Tooltip } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { SareeColor } from "@/types/saree";

const colorMap: Record<string, string> = {
  red: "#b71c1c",
  maroon: "#6a1b2d",
  blue: "#0d47a1",
  green: "#1b5e20",
  yellow: "#f9a825",
  pink: "#d81b60",
  black: "#212121",
  white: "#f5f5f5",
  gold: "#d4af37",
  default: "#8d6e63",
};

export default function ImageViewer({
  colors,
  imageText,
}: {
  colors: SareeColor[];
  imageText?: string;
}) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const activeColor = colors[activeColorIndex] ?? colors[0];
  const images = activeColor?.images ?? [];
  const activeImage = images[activeImageIndex] ?? images[0];

  useEffect(() => {
    setImageLoading(Boolean(activeImage));
  }, [activeImage]);

  const swatches = useMemo(
    () =>
      colors.map((entry) => {
        const key = entry.color.toLowerCase();
        return colorMap[key] ?? entry.color;
      }),
    [colors]
  );

  const previous = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const next = () => {
    if (images.length <= 1) return;
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          height: { xs: 280, sm: 360, md: 520 },
          bgcolor: "grey.100",
        }}
      >
        {activeImage && (
          <Image
            src={activeImage}
            alt="Saree view"
            fill
            sizes="(max-width: 900px) 100vw, 60vw"
            style={{ objectFit: "cover" }}
            priority
            onLoad={() => setImageLoading(false)}
          />
        )}
        {imageLoading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255,255,255,0.45)",
              backdropFilter: "blur(2px)",
              zIndex: 2,
            }}
          >
            <CircularProgress size={32} />
          </Box>
        )}
        {imageText && (
          <Box
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              px: { xs: 1.5, sm: 2.5 },
              py: { xs: 1.2, sm: 1.8 },
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: "0.95rem", sm: "1.1rem" },
              lineHeight: 1.2,
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.74) 100%)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {imageText}
          </Box>
        )}
        {images.length > 0 && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 10, sm: 14 },
              right: { xs: 10, sm: 14 },
              px: 1.1,
              py: 0.45,
              borderRadius: 999,
              color: "#fff",
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.82rem" },
              backgroundColor: "rgba(0,0,0,0.58)",
              backdropFilter: "blur(2px)",
            }}
          >
            {activeImageIndex + 1} / {images.length}
          </Box>
        )}

        <IconButton
          onClick={previous}
          sx={{
            position: "absolute",
            left: { xs: 8, sm: 16 },
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255, 255, 255, 0.85)",
            width: { xs: 34, sm: 40 },
            height: { xs: 34, sm: 40 },
          }}
        >
          <ArrowBackIosNewRoundedIcon />
        </IconButton>
        <IconButton
          onClick={next}
          sx={{
            position: "absolute",
            right: { xs: 8, sm: 16 },
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "rgba(255, 255, 255, 0.85)",
            width: { xs: 34, sm: 40 },
            height: { xs: 34, sm: 40 },
          }}
        >
          <ArrowForwardIosRoundedIcon />
        </IconButton>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap" }}>
        {colors.map((entry, index) => (
          <Tooltip title={entry.color} key={`${entry.color}-${index}`}>
            <Box
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveColorIndex(index);
                setActiveImageIndex(0);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setActiveColorIndex(index);
                  setActiveImageIndex(0);
                }
              }}
              sx={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                bgcolor: swatches[index],
                border: "2px solid #fff",
                boxShadow:
                  activeColorIndex === index
                    ? "0 0 0 3px rgba(139, 30, 63, 0.8)"
                    : "0 0 0 1px rgba(0,0,0,0.2)",
                cursor: "pointer",
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Stack>
  );
}
