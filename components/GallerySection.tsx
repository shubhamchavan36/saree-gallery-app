"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SareeTile from "@/components/SareeTile";
import { SareeItem, SareeStatus } from "@/types/saree";

type StatusFilter = "all" | SareeStatus;
type SortMode = "default" | "recent" | "price_asc" | "price_desc" | "name_asc";

function parseOptionalNumber(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/,/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function getItemDateValue(item: SareeItem): number {
  const value = item.updatedAt ?? item.createdAt;
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function GallerySection({ items }: { items: SareeItem[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const filtered = useMemo(
    () => {
      const q = query.trim().toLowerCase();
      const min = parseOptionalNumber(minPrice);
      const max = parseOptionalNumber(maxPrice);

      const matchesSearch = (item: SareeItem) => {
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          (item.imageText ?? "").toLowerCase().includes(q)
        );
      };

      const matchesStatus = (item: SareeItem) => {
        if (statusFilter === "all") return true;
        return item.status === statusFilter;
      };

      const matchesPrice = (item: SareeItem) => {
        if (min !== null && item.price < min) return false;
        if (max !== null && item.price > max) return false;
        return true;
      };

      const out = items
        .filter((item) => matchesSearch(item))
        .filter((item) => matchesStatus(item))
        .filter((item) => matchesPrice(item));

      if (sortMode === "default") return out;

      const sorted = [...out];
      sorted.sort((a, b) => {
        if (sortMode === "recent") return getItemDateValue(b) - getItemDateValue(a);
        if (sortMode === "price_asc") return a.price - b.price;
        if (sortMode === "price_desc") return b.price - a.price;
        if (sortMode === "name_asc") return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
        return 0;
      });

      return sorted;
    },
    [items, query, statusFilter, minPrice, maxPrice, sortMode]
  );

  const hasActiveFilters =
    query.trim().length > 0 ||
    statusFilter !== "all" ||
    minPrice.trim().length > 0 ||
    maxPrice.trim().length > 0 ||
    sortMode !== "default";

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
      <Typography variant="h6" sx={{ mb: 1.25, fontSize: { xs: "1rem", sm: "1.1rem" } }}>
        Search sarees by name
      </Typography>
      <TextField
        fullWidth
        placeholder="Type to search..."
        variant="outlined"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        inputProps={{ "aria-label": "Search sarees by name" }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            bgcolor: "#fff",
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRoundedIcon />
            </InputAdornment>
          ),
        }}
      />

      <Grid container spacing={1.5} sx={{ mb: { xs: 2.5, md: 3.5 } }}>
        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Availability"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="sold_out">Sold Out</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <TextField
            select
            fullWidth
            label="Sort by"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          >
            <MenuItem value="default">Default</MenuItem>
            <MenuItem value="recent">Newest</MenuItem>
            <MenuItem value="price_asc">Price: Low to High</MenuItem>
            <MenuItem value="price_desc">Price: High to Low</MenuItem>
            <MenuItem value="name_asc">Name: A to Z</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Min price"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            inputMode="numeric"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          />
        </Grid>

        <Grid size={{ xs: 6, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label="Max price"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            inputMode="numeric"
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            sx={{ height: "100%" }}
          >
            <Button
              variant="outlined"
              color="secondary"
              disabled={!hasActiveFilters}
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
                setMinPrice("");
                setMaxPrice("");
                setSortMode("default");
              }}
              sx={{ whiteSpace: "nowrap" }}
            >
              Clear
            </Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Showing {filtered.length} of {items.length} sarees
          </Typography>
        </Grid>
      </Grid>

      {filtered.length === 0 ? (
        <Box sx={{ py: 8, textAlign: "center" }}>
          <Typography variant="h5">No sarees found</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mt: 1 }}>
            Try a different keyword.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          {filtered.map((saree) => (
            <Grid key={saree.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <SareeTile saree={saree} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
