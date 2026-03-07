"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Header from "@/components/Header";
import { SareeItem, SareeStatus } from "@/types/saree";

type FormState = {
  name: string;
  imageText: string;
  price: string;
  status: SareeStatus;
  color: string;
  tileImage: File | null;
  galleryImages: FileList | null;
};

const initialForm: FormState = {
  name: "",
  imageText: "",
  price: "",
  status: "available",
  color: "default",
  tileImage: null,
  galleryImages: null,
};

export default function AdminPage() {
  const router = useRouter();
  const [sarees, setSarees] = useState<SareeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [editing, setEditing] = useState<SareeItem | null>(null);
  const [editForm, setEditForm] = useState<FormState>(initialForm);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/sarees", { cache: "no-store" });
        const data = (await response.json()) as SareeItem[];
        setSarees(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const refresh = async () => {
    const response = await fetch("/api/sarees", { cache: "no-store" });
    const data = (await response.json()) as SareeItem[];
    setSarees(data);
  };

  const buildFormData = (state: FormState) => {
    const payload = new FormData();
    payload.append("name", state.name);
    payload.append("imageText", state.imageText);
    payload.append("price", state.price);
    payload.append("status", state.status);
    payload.append("color", state.color);
    if (state.tileImage) payload.append("tileImage", state.tileImage);
    if (state.galleryImages) {
      Array.from(state.galleryImages).forEach((file) => payload.append("galleryImages", file));
    }
    return payload;
  };

  const submitNew = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/sarees", {
      method: "POST",
      body: buildFormData(form),
    });
    const data = await response.json();

    if (!response.ok) {
      setNotice(data.message ?? "Failed to create saree.");
      return;
    }

    setNotice("Saree added successfully.");
    setForm(initialForm);
    await refresh();
  };

  const submitEdit = async () => {
    if (!editing) return;
    const response = await fetch(`/api/sarees/${editing.id}`, {
      method: "PUT",
      body: buildFormData(editForm),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.message ?? "Failed to update saree.");
      return;
    }

    setNotice("Saree updated successfully.");
    setEditing(null);
    setEditForm(initialForm);
    await refresh();
  };

  const deleteSaree = async (id: string) => {
    const proceed = window.confirm("Delete this saree?");
    if (!proceed) return;
    await fetch(`/api/sarees/${id}`, { method: "DELETE" });
    setNotice("Saree deleted successfully.");
    await refresh();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <Box className="app-shell-bg" sx={{ minHeight: "100vh", pb: 5 }}>
      <Header />
      <Container maxWidth="lg" sx={{ mt: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="h3" sx={{ fontSize: { xs: "1.8rem", sm: "2.25rem", md: "3rem" } }}>
            Admin Panel
          </Typography>
          <Button variant="outlined" color="primary" onClick={() => void logout()}>
            Logout
          </Button>
        </Stack>
        <Typography sx={{ mt: 1, color: "text.secondary" }}>
          Manage saree catalog using local JSON and local image uploads.
        </Typography>

        {notice && (
          <Alert sx={{ mt: 2 }} onClose={() => setNotice(null)}>
            {notice}
          </Alert>
        )}

        <Paper
          component="form"
          onSubmit={submitNew}
          sx={{ mt: 3, p: { xs: 2, sm: 3 }, borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)" }}
        >
          <Typography variant="h5" sx={{ fontSize: { xs: "1.35rem", sm: "1.5rem" } }}>
            Add New Saree
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                required
                label="Saree Name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Image Text"
                value={form.imageText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, imageText: event.target.value }))
                }
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                required
                label="Price"
                type="number"
                value={form.price}
                onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                select
                label="Availability"
                value={form.status}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, status: event.target.value as SareeStatus }))
                }
              >
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="sold_out">Sold Out</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Color Group"
                value={form.color}
                onChange={(event) => setForm((prev) => ({ ...prev, color: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  minHeight: { xs: "52px", sm: "56px" },
                  height: "auto",
                  py: 1.2,
                  px: 1.5,
                  textAlign: "center",
                  lineHeight: 1.2,
                  whiteSpace: "normal",
                }}
              >
                Upload Tile Image
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tileImage: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </Button>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  minHeight: { xs: "52px", sm: "56px" },
                  height: "auto",
                  py: 1.2,
                  px: 1.5,
                  textAlign: "center",
                  lineHeight: 1.2,
                  whiteSpace: "normal",
                }}
              >
                Upload Gallery Images
                <input
                  hidden
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, galleryImages: event.target.files }))
                  }
                />
              </Button>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 2 }}>
            Add Saree
          </Button>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{
            mt: 3,
            borderRadius: 3,
            border: "1px solid rgba(0,0,0,0.08)",
            display: { xs: "none", md: "block" },
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>Loading...</TableCell>
                </TableRow>
              ) : sarees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>No sarees yet.</TableCell>
                </TableRow>
              ) : (
                sarees.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box sx={{ position: "relative", width: 70, height: 70, borderRadius: 2, overflow: "hidden" }}>
                        <Image src={item.tileImage} alt={item.name} fill style={{ objectFit: "cover" }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography noWrap title={item.name}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>Rs. {item.price.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.status === "available" ? "Available" : "Sold Out"}
                        color={item.status === "available" ? "success" : "error"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditRoundedIcon />}
                          onClick={() => {
                            setEditing(item);
                            setEditForm({
                              name: item.name,
                              imageText: item.imageText ?? item.name,
                              price: item.price.toString(),
                              status: item.status,
                              color: "default",
                              tileImage: null,
                              galleryImages: null,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteRoundedIcon />}
                          onClick={() => void deleteSaree(item.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack spacing={1.5} sx={{ mt: 3, display: { xs: "flex", md: "none" } }}>
          {loading ? (
            <Paper sx={{ p: 2 }}>Loading...</Paper>
          ) : sarees.length === 0 ? (
            <Paper sx={{ p: 2 }}>No sarees yet.</Paper>
          ) : (
            sarees.map((item) => (
              <Card key={item.id} sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Box sx={{ position: "relative", width: 76, height: 76, borderRadius: 2, overflow: "hidden", flexShrink: 0 }}>
                      <Image src={item.tileImage} alt={item.name} fill style={{ objectFit: "cover" }} />
                    </Box>
                    <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ fontWeight: 600 }} noWrap>
                        {item.name}
                      </Typography>
                      <Typography variant="body2">Rs. {item.price.toLocaleString("en-IN")}</Typography>
                      <Chip
                        size="small"
                        label={item.status === "available" ? "Available" : "Sold Out"}
                        color={item.status === "available" ? "success" : "error"}
                        sx={{ width: "fit-content" }}
                      />
                    </Stack>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      size="small"
                      fullWidth
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => {
                        setEditing(item);
                        setEditForm({
                          name: item.name,
                          imageText: item.imageText ?? item.name,
                          price: item.price.toString(),
                          status: item.status,
                          color: "default",
                          tileImage: null,
                          galleryImages: null,
                        });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteRoundedIcon />}
                      onClick={() => void deleteSaree(item.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Container>

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Saree</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Saree Name"
              value={editForm.name}
              onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <TextField
              fullWidth
              label="Image Text"
              value={editForm.imageText}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, imageText: event.target.value }))
              }
            />
            <TextField
              fullWidth
              type="number"
              label="Price"
              value={editForm.price}
              onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))}
            />
            <TextField
              fullWidth
              select
              label="Availability"
              value={editForm.status}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, status: event.target.value as SareeStatus }))
              }
            >
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="sold_out">Sold Out</MenuItem>
            </TextField>
            <TextField
              fullWidth
              label="Add Images to Color Group"
              value={editForm.color}
              onChange={(event) => setEditForm((prev) => ({ ...prev, color: event.target.value }))}
            />
            <Button
              variant="outlined"
              component="label"
              sx={{ textAlign: "center", lineHeight: 1.2, whiteSpace: "normal", py: 1.1 }}
            >
              Replace Tile Image
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    tileImage: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </Button>
            <Button
              variant="outlined"
              component="label"
              sx={{ textAlign: "center", lineHeight: 1.2, whiteSpace: "normal", py: 1.1 }}
            >
              Upload Additional Gallery Images
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, galleryImages: event.target.files }))
                }
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button onClick={() => void submitEdit()} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
