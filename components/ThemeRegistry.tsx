"use client";

import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: { main: "#8b1e3f" },
    secondary: { main: "#d4a76a" },
    background: {
      default: "#f7f3ef",
      paper: "#fffaf6",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "var(--font-poppins), sans-serif",
    h3: {
      fontFamily: "var(--font-playfair), serif",
      fontWeight: 700,
    },
    h4: {
      fontFamily: "var(--font-playfair), serif",
      fontWeight: 700,
    },
    h5: {
      fontFamily: "var(--font-playfair), serif",
      fontWeight: 700,
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
