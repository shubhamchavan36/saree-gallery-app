"use client";

import { useMemo, useState } from "react";
import { Box, Container, Grid, InputAdornment, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SareeTile from "@/components/SareeTile";
import { SareeItem } from "@/types/saree";

export default function GallerySection({ items }: { items: SareeItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())),
    [items, query]
  );

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
          mb: { xs: 3, md: 4 },
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
