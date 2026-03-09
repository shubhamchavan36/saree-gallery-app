import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { SareeItem } from "@/types/saree";

export default function SareeTile({ saree }: { saree: SareeItem }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0 16px 34px rgba(74, 35, 46, 0.1)",
        transition: "transform 240ms ease, box-shadow 240ms ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 20px 40px rgba(74, 35, 46, 0.16)",
        },
      }}
    >
      <CardActionArea component={Link} href={`/saree/${saree.id}`}>
        <Stack
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: { xs: "1 / 1", sm: "5 / 5" },
            bgcolor: "#f6efe8",
          }}
        >
          <Image
            src={saree.tileImage}
            alt={saree.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: "contain" }}
          />
          <Stack
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              px: 1.5,
              py: 1.25,
              color: "#fff",
              background: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.72) 100%)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {saree.imageText || saree.name}
            </Typography>
          </Stack>
        </Stack>
        <CardContent sx={{ px: 1.5, py: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Stack direction="row" spacing={0.8} alignItems="flex-start" justifyContent="space-between">
            <Typography
              variant="subtitle1"
              sx={{
                overflowWrap: "anywhere",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                lineHeight: 1.2,
                minHeight: "2.35em",
                flex: 1,
              }}
            >
              {saree.name}
            </Typography>
            {saree.status === "sold_out" && (
              <Chip label="Sold Out" color="error" size="small" sx={{ fontWeight: 700, mt: 0.1 }} />
            )}
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.35, color: "primary.main", fontWeight: 600 }}>
            Rs. {saree.price.toLocaleString("en-IN")}
          </Typography>
          <Typography variant="caption" sx={{ mt: 0.5, color: "text.secondary", display: "block" }}>
            {saree.status === "available" ? "Available" : "Currently unavailable"}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
