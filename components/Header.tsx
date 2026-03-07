"use client";

import Link from "next/link";
import { AppBar, Box, Button, Container, Toolbar, Typography } from "@mui/material";

export default function Header() {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: "rgba(255, 250, 246, 0.92)",
        color: "text.primary",
        borderBottom: "1px solid rgba(139, 30, 63, 0.15)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            py: 1,
            gap: 1.5,
            flexWrap: { xs: "wrap", sm: "nowrap" },
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h5"
            component={Link}
            href="/"
            sx={{
              textDecoration: "none",
              color: "primary.main",
              flexGrow: { xs: 0, sm: 1 },
              width: { xs: "100%", sm: "auto" },
              textAlign: { xs: "center", sm: "left" },
              letterSpacing: "0.02em",
              fontSize: { xs: "1.45rem", sm: "1.75rem" },
            }}
          >
            Saree Gallery
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1,
              width: { xs: "100%", sm: "auto" },
              justifyContent: { xs: "center", sm: "flex-end" },
            }}
          >
            <Button component={Link} href="/" color="inherit" size="small">
              Gallery
            </Button>
            <Button component={Link} href="/admin" variant="contained" color="primary" size="small">
              Admin
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
