"use client";

import { useMemo, useState } from "react";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ShareRoundedIcon from "@mui/icons-material/ShareRounded";

type DetailActionsProps = {
  itemName: string;
  imageUrls: string[];
};

function makeSafeFileBase(name: string): string {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return "saree";
  return trimmed.replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
}

function detectExt(url: string, mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";

  try {
    const pathname = new URL(url).pathname;
    const maybeExt = pathname.split(".").pop()?.toLowerCase();
    if (maybeExt && maybeExt.length <= 5) return maybeExt;
  } catch {
    // ignore invalid URL parsing
  }
  return "jpg";
}

function resolveOriginalImageUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.origin);
    const wrappedSource = parsed.searchParams.get("url");
    if (wrappedSource) {
      return decodeURIComponent(wrappedSource);
    }
  } catch {
    // ignore URL parsing errors and use original URL
  }
  return url;
}

export default function DetailActions({ itemName, imageUrls }: DetailActionsProps) {
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const uniqueUrls = useMemo(() => Array.from(new Set(imageUrls)), [imageUrls]);

  const handleDownloadAll = async () => {
    if (uniqueUrls.length === 0 || busy) return;

    setBusy(true);
    setStatusText(null);

    try {
      const base = makeSafeFileBase(itemName);
      for (let index = 0; index < uniqueUrls.length; index += 1) {
        const url = resolveOriginalImageUrl(uniqueUrls[index]);
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Image download failed (${response.status})`);
        }

        const blob = await response.blob();
        const ext = detectExt(url, blob.type);
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `${base}-${index + 1}.${ext}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      }
      setStatusText(`Downloaded ${uniqueUrls.length} image(s).`);
    } catch {
      setStatusText("Failed to download one or more images.");
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: itemName,
          text: `Check out this saree: ${itemName}`,
          url,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setStatusText("Link copied to clipboard.");
      } else {
        setStatusText(url);
      }
    } catch {
      setStatusText("Unable to share this page right now.");
    }
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 2 }}>
      <Tooltip title="Download all images">
        <span>
          <IconButton
            color="primary"
            onClick={() => void handleDownloadAll()}
            disabled={busy || uniqueUrls.length === 0}
            aria-label="Download all images"
          >
            <DownloadRoundedIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Share this page">
        <IconButton color="primary" onClick={() => void handleShare()} aria-label="Share page">
          <ShareRoundedIcon />
        </IconButton>
      </Tooltip>
      {statusText && (
        <Typography variant="caption" sx={{ ml: 1, color: "text.secondary" }}>
          {statusText}
        </Typography>
      )}
    </Stack>
  );
}
