"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Box, CircularProgress, IconButton, Stack, Tooltip } from "@mui/material";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import { SareeColor, SareeStatus } from "@/types/saree";
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export type ImageViewerActiveImageMeta = {
  url: string;
  status: SareeStatus;
  color: string;
  index: number;
  total: number;
  label: string;
};

export default function ImageViewer({
  colors,
  imageText,
  onActiveImageChange,
}: {
  colors: SareeColor[];
  imageText?: string;
  onActiveImageChange?: (meta: ImageViewerActiveImageMeta | null) => void;
}) {
  const [activeColorIndex, setActiveColorIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null);

  const activeColor = colors[activeColorIndex] ?? colors[0];
  const images = activeColor?.images ?? [];
  const activeImage = images[activeImageIndex] ?? images[0];
  const activeImageUrl = activeImage?.url;
  const thumbnailItems = colors.flatMap((entry, colorIndex) =>
    entry.images.map((image, imageIndex) => ({
      imageUrl: image.url,
      status: image.status,
      color: entry.color,
      colorIndex,
      imageIndex,
    }))
  );

  useEffect(() => {
    if (!onActiveImageChange) return;
    if (!activeImageUrl) {
      onActiveImageChange(null);
      return;
    }

    const color = (activeColor?.color ?? "default").trim() || "default";
    const total = images.length;
    const index = Math.min(Math.max(activeImageIndex, 0), Math.max(total - 1, 0));
    const status = activeImage?.status ?? "available";
    const label = `${color} ${index + 1}`;

    onActiveImageChange({
      url: activeImageUrl,
      status,
      color,
      index,
      total,
      label,
    });
  }, [onActiveImageChange, activeImageUrl, activeImage?.status, activeColor?.color, activeImageIndex, images.length]);

  const previous = () => {
    if (images.length <= 1) return;
    setImageLoading(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const next = () => {
    if (images.length <= 1) return;
    setImageLoading(true);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const clampPan = (nextPan: { x: number; y: number }, zoomLevel: number) => {
    if (zoomLevel <= 1) return { x: 0, y: 0 };
    const viewport = viewportRef.current;
    if (!viewport) return nextPan;

    const maxX = ((zoomLevel - 1) * viewport.clientWidth) / 2;
    const maxY = ((zoomLevel - 1) * viewport.clientHeight) / 2;

    return {
      x: Math.max(-maxX, Math.min(maxX, nextPan.x)),
      y: Math.max(-maxY, Math.min(maxY, nextPan.y)),
    };
  };

  const applyZoom = (zoomLevel: number) => {
    setZoom(zoomLevel);
    setPan((prev) => clampPan(prev, zoomLevel));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId || zoom <= 1) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    setPan(clampPan({ x: dragState.panX + deltaX, y: dragState.panY + deltaY }, zoom));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    dragStateRef.current = null;
    setDragging(false);
  };

  return (
    <Stack spacing={2.5}>
      <Box
        ref={viewportRef}
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          height: { xs: "68vh", sm: "74vh", md: "82vh" },
          minHeight: { xs: 420, sm: 520, md: 640 },
          maxHeight: 980,
          bgcolor: "#f6efe8",
        }}
      >
        {activeImageUrl && (
          <Box
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
              touchAction: zoom > 1 ? "none" : "auto",
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
            }}
          >
            <Image
              src={activeImageUrl}
              alt="Saree view"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              style={{
                objectFit: "contain",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: dragging ? "none" : "transform 180ms ease",
                transformOrigin: "center center",
              }}
              priority
              unoptimized
              onLoad={() => setImageLoading(false)}
            />
          </Box>
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
              zIndex: 4,
            }}
          >
            {activeImageIndex + 1} / {images.length}
          </Box>
        )}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            position: "absolute",
            right: { xs: 10, sm: 14 },
            bottom: imageText ? { xs: 56, sm: 72 } : { xs: 10, sm: 14 },
            bgcolor: "rgba(0,0,0,0.5)",
            borderRadius: 999,
            px: 0.4,
            py: 0.2,
            zIndex: 4,
          }}
        >
          <Tooltip title="Zoom out">
            <span>
              <IconButton
                size="small"
                onClick={() => applyZoom(Math.max(MIN_ZOOM, Number((zoom - ZOOM_STEP).toFixed(2))))}
                disabled={zoom <= MIN_ZOOM}
                sx={{ color: "#fff" }}
              >
                <ZoomOutRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Reset zoom">
            <IconButton size="small" onClick={() => { applyZoom(MIN_ZOOM); setPan({ x: 0, y: 0 }); }} sx={{ color: "#fff" }}>
              <RestartAltRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Zoom in">
            <span>
              <IconButton
                size="small"
                onClick={() => applyZoom(Math.min(MAX_ZOOM, Number((zoom + ZOOM_STEP).toFixed(2))))}
                disabled={zoom >= MAX_ZOOM}
                sx={{ color: "#fff" }}
              >
                <ZoomInRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

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
            zIndex: 4,
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
            zIndex: 4,
          }}
        >
          <ArrowForwardIosRoundedIcon />
        </IconButton>
      </Box>

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
        {thumbnailItems.map((thumb, index) => {
          const selected =
            thumb.colorIndex === activeColorIndex && thumb.imageIndex === activeImageIndex;

          return (
            <Tooltip title={`${thumb.color} ${thumb.imageIndex + 1}`} key={`${thumb.imageUrl}-${index}`}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => {
                  setImageLoading(true);
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                  setActiveColorIndex(thumb.colorIndex);
                  setActiveImageIndex(thumb.imageIndex);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setImageLoading(true);
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                    setActiveColorIndex(thumb.colorIndex);
                    setActiveImageIndex(thumb.imageIndex);
                  }
                }}
                sx={{
                  position: "relative",
                  width: { xs: 54, sm: 62 },
                  height: { xs: 54, sm: 62 },
                  borderRadius: 1.5,
                  overflow: "hidden",
                  border: "2px solid #fff",
                  boxShadow: selected
                    ? "0 0 0 3px rgba(139, 30, 63, 0.85)"
                    : "0 0 0 1px rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  bgcolor: "grey.100",
                }}
              >
                <Image
                  src={thumb.imageUrl}
                  alt={`Thumbnail ${thumb.imageIndex + 1}`}
                  fill
                  sizes="64px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
                {thumb.status === "sold_out" && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      px: 0.6,
                      py: 0.2,
                      borderRadius: 999,
                      bgcolor: "rgba(211, 47, 47, 0.92)",
                      color: "#fff",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      lineHeight: 1.2,
                      letterSpacing: 0.2,
                      boxShadow: "0 6px 12px rgba(0,0,0,0.25)",
                      pointerEvents: "none",
                    }}
                  >
                    Sold
                  </Box>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Stack>
    </Stack>
  );
}
