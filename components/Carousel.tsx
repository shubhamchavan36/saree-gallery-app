"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { SareeItem } from "@/types/saree";

interface CarouselProps {
  items: SareeItem[];
}

export default function Carousel({ items }: CarouselProps) {
  const featured = useMemo(() => items.slice(0, 5), [items]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [featured.length]);

  if (featured.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          position: "relative",
          height: { xs: 260, sm: 320, md: 420 },
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(58, 23, 34, 0.15)",
        }}
      >
        {featured.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              position: "absolute",
              inset: 0,
              opacity: index === activeIndex ? 1 : 0,
              transform: `scale(${index === activeIndex ? 1 : 1.03})`,
              transition: "opacity 900ms ease, transform 900ms ease",
            }}
          >
            <Image
              src={item.tileImage}
              alt={item.name}
              fill
              sizes="100vw"
              style={{ objectFit: "cover" }}
              priority={index === 0}
            />

            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(100deg, rgba(25, 11, 15, 0.78) 0%, rgba(25, 11, 15, 0.3) 58%, rgba(25, 11, 15, 0.1) 100%)",
              }}
            />

            <Stack
              spacing={1.5}
              sx={{
                position: "absolute",
                left: { xs: 14, sm: 20, md: 40 },
                bottom: { xs: 14, sm: 20, md: 34 },
                maxWidth: { xs: "90%", sm: 420 },
                color: "#fff",
              }}
            >
              <Chip
                label={item.status === "available" ? "Featured" : "Sold Out"}
                color={item.status === "available" ? "secondary" : "default"}
                sx={{ width: "fit-content" }}
              />
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.45rem", sm: "2rem", md: "2.25rem" },
                  lineHeight: 1.15,
                  maxWidth: "100%",
                  overflowWrap: "anywhere",
                  display: "-webkit-box",
                  WebkitLineClamp: { xs: 2, sm: 2, md: 3 },
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.imageText || item.name}
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: "1rem", sm: "1.2rem" } }}>
                {item.name} · Rs. {item.price.toLocaleString("en-IN")}
              </Typography>
              <Button
                component={Link}
                href={`/saree/${item.id}`}
                variant="contained"
                color="secondary"
                size="small"
                sx={{ width: "fit-content" }}
              >
                View Details
              </Button>
            </Stack>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
