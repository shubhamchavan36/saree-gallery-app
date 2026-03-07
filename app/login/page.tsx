"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Header from "@/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Invalid credentials.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="app-shell-bg" sx={{ minHeight: "100vh", pb: 6 }}>
      <Header />
      <Container maxWidth="sm" sx={{ mt: { xs: 4, md: 8 } }}>
        <Paper
          component="form"
          onSubmit={submit}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", sm: "2rem" } }}>
            Admin Login
          </Typography>
          <Typography sx={{ color: "text.secondary", mt: 1 }}>
            Enter username and password to access admin panel.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 2.5 }}>
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
