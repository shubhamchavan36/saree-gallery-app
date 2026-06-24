"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Alert,
  Backdrop,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Header from "@/components/Header";
import { SareeItem, SareeStatus } from "@/types/saree";

type FormState = {
  name: string;
  imageText: string;
  price: string;
  status: SareeStatus;
  color: string;
  tileImage: File | null;
  galleryImages: File[];
  description: string;
};

type GalleryDraftItem = {
  file: File;
  previewUrl: string;
  status: SareeStatus;
};

const initialForm: FormState = {
  name: "",
  imageText: "",
  price: "",
  status: "available",
  color: "default",
  tileImage: null,
  galleryImages: [],
  description: "",
};

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split("/").pop() || url;
  } catch {
    return url;
  }
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [sarees, setSarees] = useState<SareeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [newGalleryDraft, setNewGalleryDraft] = useState<GalleryDraftItem[]>([]);
  const [newGalleryDialogOpen, setNewGalleryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SareeItem | null>(null);
  const [editForm, setEditForm] = useState<FormState>(initialForm);
  const [editExistingTileImage, setEditExistingTileImage] = useState<string | null>(null);
  const [editExistingGalleryImages, setEditExistingGalleryImages] = useState<SareeItem["colors"][number]["images"]>([]);
  const [editRemovedGalleryImages, setEditRemovedGalleryImages] = useState<string[]>([]);
  const [editGalleryManagerOpen, setEditGalleryManagerOpen] = useState(false);
  const [editNewGalleryDraft, setEditNewGalleryDraft] = useState<GalleryDraftItem[]>([]);
  const [editNewGalleryDialogOpen, setEditNewGalleryDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredImageUrl, setHoveredImageUrl] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);

  const formGalleryFileNames = form.galleryImages.map((file) => file.name);
  const filteredSarees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sarees;
    return sarees.filter((item) => {
      const galleryCount = item.colors.reduce((total, entry) => total + entry.images.length, 0);
      return (
        item.name.toLowerCase().includes(query) ||
        (item.imageText ?? "").toLowerCase().includes(query) ||
        item.status.toLowerCase().includes(query) ||
        String(item.price).includes(query) ||
        String(galleryCount).includes(query)
      );
    });
  }, [sarees, searchQuery]);
  const pagedSarees = useMemo(() => {
    const start = tablePage * rowsPerPage;
    return filteredSarees.slice(start, start + rowsPerPage);
  }, [filteredSarees, tablePage, rowsPerPage]);

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
    const response = await fetch("/api/sarees", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const data = (await response.json()) as SareeItem[];
    setSarees(data);
  };

  const buildFormData = (
    state: FormState,
    removedGalleryImageUrls: string[] = [],
    galleryImageStatusMap: Record<string, SareeStatus> = {},
    newGalleryStatuses: SareeStatus[] = []
  ) => {
    const payload = new FormData();
    payload.append("name", state.name);
    payload.append("imageText", state.imageText);
    payload.append("price", state.price);
    payload.append("status", state.status);
    payload.append("color", state.color);
    payload.append("description", state.description);

    if (state.tileImage) {
      payload.append("tileImage", state.tileImage);
    }

    state.galleryImages.forEach((file) => {
      payload.append("galleryImages", file);
    });

    removedGalleryImageUrls.forEach((url) => payload.append("removedGalleryImageUrls", url));
    payload.append("galleryImageStatusMap", JSON.stringify(galleryImageStatusMap));
    payload.append("newGalleryStatuses", JSON.stringify(newGalleryStatuses));
    return payload;
  };

  const submitNew = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      setNotice("Saving saree...");
      const galleryStatusMap: Record<string, SareeStatus> = {};
      const newGalleryStatuses = newGalleryDraft.map((item) => item.status ?? "available");
      const response = await fetch("/api/sarees", {
        method: "POST",
        credentials: "same-origin",
        body: buildFormData(form, [], galleryStatusMap, newGalleryStatuses),
      });
      const data = await response.json();

      if (!response.ok) {
        setNotice(data.message ?? "Failed to create saree.");
        return;
      }

      setNotice("Saree added successfully.");
      setForm(initialForm);
      replaceNewGalleryDraft([]);
      await refresh();
    } catch {
      setNotice("Failed to save saree.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      setNotice("Saving changes...");
      const galleryStatusMap: Record<string, SareeStatus> = {};
      editExistingGalleryImages.forEach((img) => {
        galleryStatusMap[img.url] = img.status ?? "available";
      });
      const newGalleryStatuses = editNewGalleryDraft.map((item) => item.status ?? "available");
      const response = await fetch(`/api/sarees/${editing.id}`, {
        method: "PUT",
        credentials: "same-origin",
        body: buildFormData(editForm, editRemovedGalleryImages, galleryStatusMap, newGalleryStatuses),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.message ?? "Failed to update saree.");
        return;
      }

      setNotice("Saree updated successfully.");
      closeEdit();
      await refresh();
    } catch {
      setNotice("Failed to save changes.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSaree = async (id: string) => {
    const proceed = window.confirm("Delete this saree?");
    if (!proceed) return;
    const response = await fetch(`/api/sarees/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { message?: string };
      setNotice(data.message ?? "Failed to delete saree.");
      return;
    }
    setNotice("Saree deleted successfully.");
    await refresh();
  };

  const logout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    router.replace("/login");
    router.refresh();
  };

  const openEdit = (item: SareeItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      imageText: item.imageText ?? item.name,
      price: item.price.toString(),
      status: item.status,
      color: item.colors[0]?.color ?? "default",
      tileImage: null,
      galleryImages: [],
      description: item.description ?? "",
    });
    setEditExistingTileImage(item.tileImage ?? null);
    setEditExistingGalleryImages(item.colors.flatMap((entry) => entry.images));
    setEditRemovedGalleryImages([]);
    replaceEditNewGalleryDraft([]);
    setEditGalleryManagerOpen(false);
    setEditNewGalleryDialogOpen(false);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(initialForm);
    setEditExistingTileImage(null);
    setEditExistingGalleryImages([]);
    setEditRemovedGalleryImages([]);
    replaceEditNewGalleryDraft([]);
    setEditGalleryManagerOpen(false);
    setEditNewGalleryDialogOpen(false);
  };

  const removeExistingGalleryImage = (imageUrl: string) => {
    setEditExistingGalleryImages((prev) => prev.filter((img) => img.url !== imageUrl));
    setEditRemovedGalleryImages((prev) =>
      prev.includes(imageUrl) ? prev : [...prev, imageUrl]
    );
  };

  const replaceNewGalleryDraft = (next: GalleryDraftItem[]) => {
    setNewGalleryDraft((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return next;
    });
  };

  const replaceEditNewGalleryDraft = (next: GalleryDraftItem[]) => {
    setEditNewGalleryDraft((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return next;
    });
  };

  const beginNewGallerySelection = (files: File[]) => {
    setForm((prev) => ({ ...prev, galleryImages: files }));
    replaceNewGalleryDraft(
      files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: form.status,
      }))
    );
    setNewGalleryDialogOpen(files.length > 0);
  };

  const beginEditNewGallerySelection = (files: File[]) => {
    if (files.length === 0) return;
    setEditForm((prev) => ({ ...prev, galleryImages: [...prev.galleryImages, ...files] }));
    setEditNewGalleryDraft((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: editForm.status,
      })),
    ]);
    setEditNewGalleryDialogOpen(true);
  };

  const updateNewDraftStatus = (index: number, status: SareeStatus) => {
    setNewGalleryDraft((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, status } : item))
    );
  };

  const removeNewDraftAt = (index: number) => {
    setNewGalleryDraft((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
    setForm((prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((_, idx) => idx !== index) }));
  };

  const updateEditNewDraftStatus = (index: number, status: SareeStatus) => {
    setEditNewGalleryDraft((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, status } : item))
    );
  };

  const removeEditNewDraftAt = (index: number) => {
    setEditNewGalleryDraft((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
    setEditForm((prev) => ({ ...prev, galleryImages: prev.galleryImages.filter((_, idx) => idx !== index) }));
  };

  const updateExistingGalleryImageStatus = (imageUrl: string, status: SareeStatus) => {
    setEditExistingGalleryImages((prev) =>
      prev.map((img) => (img.url === imageUrl ? { ...img, status } : img))
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setTablePage(0);
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
          Manage saree catalog using LocalStack S3 and DynamoDB storage.
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
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
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
                  multiple={false}
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tileImage: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </Button>
              <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: "text.secondary" }}>
                {form.tileImage ? form.tileImage.name : "No tile image selected"}
              </Typography>
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
                  onChange={(event) => beginNewGallerySelection(Array.from(event.target.files ?? []))}
                />
              </Button>
              <Typography variant="caption" sx={{ mt: 0.75, display: "block", color: "text.secondary" }}>
                {formGalleryFileNames.length > 0
                  ? formGalleryFileNames.join(", ")
                  : "No gallery images selected"}
              </Typography>
            </Grid>
          </Grid>
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={submitting}>
            {submitting ? "Saving..." : "Add Saree"}
          </Button>
        </Paper>
        <TextField
          fullWidth
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Search by name, image text, status, price, count..."
          sx={{ mt: 2.2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
        />

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
                <TableCell>Date & Time</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Gallery Images</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>Loading...</TableCell>
                </TableRow>
              ) : filteredSarees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>No matching sarees found.</TableCell>
                </TableRow>
              ) : (
                pagedSarees.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Box
                        sx={{ position: "relative", width: 70, height: 70, borderRadius: 2, overflow: "hidden", cursor: "pointer" }}
                        onClick={() => router.push(`/saree/${item.id}`)}
                        title="Open details"
                        onMouseEnter={() => {
                          isHoveringRef.current = true;
                          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                          setHoveredImageUrl(item.tileImage);
                        }}
                        onMouseLeave={() => {
                          isHoveringRef.current = false;
                          hoverTimeoutRef.current = setTimeout(() => {
                            if (!isHoveringRef.current) setHoveredImageUrl(null);
                          }, 150);
                        }}
                      >
                        <Image src={item.tileImage} alt={item.name} fill style={{ objectFit: "cover" }} />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography noWrap title={item.name}>
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDateTime(item.updatedAt ?? item.createdAt)}</TableCell>
                    <TableCell>Rs. {item.price.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      {item.colors.reduce((total, entry) => total + entry.images.length, 0)}
                    </TableCell>
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
                          onClick={() => openEdit(item)}
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
          {!loading && filteredSarees.length > 0 && (
            <TablePagination
              component="div"
              count={filteredSarees.length}
              page={tablePage}
              onPageChange={(_, newPage) => setTablePage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setTablePage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
            />
          )}
        </TableContainer>

        <Stack spacing={1.5} sx={{ mt: 3, display: { xs: "flex", md: "none" } }}>
          {loading ? (
            <Paper sx={{ p: 2 }}>Loading...</Paper>
          ) : filteredSarees.length === 0 ? (
            <Paper sx={{ p: 2 }}>No matching sarees found.</Paper>
          ) : (
            filteredSarees.map((item) => (
              <Card key={item.id} sx={{ borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)" }}>
                <CardContent sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{ position: "relative", width: 76, height: 76, borderRadius: 2, overflow: "hidden", flexShrink: 0, cursor: "pointer" }}
                      onClick={() => router.push(`/saree/${item.id}`)}
                      title="Open details"
                    >
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
                      onClick={() => openEdit(item)}
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

      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth="sm">
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
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editForm.description}
              onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
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
                multiple={false}
                accept="image/*"
                onChange={(event) =>
                  setEditForm((prev) => ({
                    ...prev,
                    tileImage: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </Button>
            <Typography variant="caption" sx={{ mt: -1, display: "block", color: "text.secondary" }}>
              {editForm.tileImage
                ? editForm.tileImage.name
                : editExistingTileImage
                  ? `Current: ${getFileNameFromUrl(editExistingTileImage)}`
                  : "No tile image selected"}
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setEditGalleryManagerOpen(true)}
              sx={{ textAlign: "center", lineHeight: 1.2, whiteSpace: "normal", py: 1.1 }}
            >
              Manage Gallery Images
            </Button>
            <Typography variant="caption" sx={{ mt: -1, display: "block", color: "text.secondary" }}>
              {editExistingGalleryImages.length} existing image(s)
              {editNewGalleryDraft.length > 0 ? `, ${editNewGalleryDraft.length} pending upload` : ""}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeEdit} disabled={submitting}>Cancel</Button>
          <Button onClick={() => void submitEdit()} variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={newGalleryDialogOpen}
        onClose={() => setNewGalleryDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Selected Gallery Images</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {newGalleryDraft.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>No gallery images selected.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Saree Name</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell align="right">Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newGalleryDraft.map((item, index) => (
                    <TableRow key={`${item.file.name}-${index}`}>
                      <TableCell sx={{ width: 88 }}>
                        <Box
                          component="img"
                          src={item.previewUrl}
                          alt={item.file.name}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 1.5,
                            objectFit: "cover",
                            border: "1px solid rgba(0,0,0,0.12)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={() => {
                            isHoveringRef.current = true;
                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                            setHoveredImageUrl(item.previewUrl);
                          }}
                          onMouseLeave={() => {
                            isHoveringRef.current = false;
                            hoverTimeoutRef.current = setTimeout(() => {
                              if (!isHoveringRef.current) setHoveredImageUrl(null);
                            }, 150);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }} noWrap title={form.name || ""}>
                          {form.name || "(Saree name not set yet)"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap title={item.file.name}>
                          {item.file.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: 180 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={item.status}
                          onChange={(event) => updateNewDraftStatus(index, event.target.value as SareeStatus)}
                        >
                          <MenuItem value="available">Available</MenuItem>
                          <MenuItem value="sold_out">Sold Out</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteRoundedIcon />}
                          onClick={() => removeNewDraftAt(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Typography variant="caption" sx={{ mt: 1.25, display: "block", color: "text.secondary" }}>
            These settings will apply when you click Add Saree.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            color="error"
            onClick={() => {
              replaceNewGalleryDraft([]);
              setForm((prev) => ({ ...prev, galleryImages: [] }));
              setNewGalleryDialogOpen(false);
            }}
            disabled={submitting}
          >
            Clear
          </Button>
          <Button onClick={() => setNewGalleryDialogOpen(false)} variant="contained" disabled={submitting}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editNewGalleryDialogOpen}
        onClose={() => setEditNewGalleryDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Selected New Gallery Images</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {editNewGalleryDraft.length === 0 ? (
            <Typography sx={{ color: "text.secondary" }}>No new gallery images selected.</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Image</TableCell>
                    <TableCell>Saree Name</TableCell>
                    <TableCell>Availability</TableCell>
                    <TableCell align="right">Remove</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editNewGalleryDraft.map((item, index) => (
                    <TableRow key={`${item.file.name}-${index}`}>
                      <TableCell sx={{ width: 88 }}>
                        <Box
                          component="img"
                          src={item.previewUrl}
                          alt={item.file.name}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: 1.5,
                            objectFit: "cover",
                            border: "1px solid rgba(0,0,0,0.12)",
                            cursor: "pointer",
                          }}
                          onMouseEnter={() => {
                            isHoveringRef.current = true;
                            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                            setHoveredImageUrl(item.previewUrl);
                          }}
                          onMouseLeave={() => {
                            isHoveringRef.current = false;
                            hoverTimeoutRef.current = setTimeout(() => {
                              if (!isHoveringRef.current) setHoveredImageUrl(null);
                            }, 150);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }} noWrap title={editForm.name || ""}>
                          {editForm.name || "(Saree name not set)"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap title={item.file.name}>
                          {item.file.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ width: 180 }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={item.status}
                          onChange={(event) =>
                            updateEditNewDraftStatus(index, event.target.value as SareeStatus)
                          }
                        >
                          <MenuItem value="available">Available</MenuItem>
                          <MenuItem value="sold_out">Sold Out</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell align="right" sx={{ width: 120 }}>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteRoundedIcon />}
                          onClick={() => removeEditNewDraftAt(index)}
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Typography variant="caption" sx={{ mt: 1.25, display: "block", color: "text.secondary" }}>
            These images will be uploaded when you click Save in Edit Saree.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            color="error"
            onClick={() => {
              replaceEditNewGalleryDraft([]);
              setEditForm((prev) => ({ ...prev, galleryImages: [] }));
              setEditNewGalleryDialogOpen(false);
            }}
            disabled={submitting}
          >
            Clear
          </Button>
          <Button onClick={() => setEditNewGalleryDialogOpen(false)} variant="contained" disabled={submitting}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={editGalleryManagerOpen}
        onClose={() => setEditGalleryManagerOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Manage Gallery Images</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              component="label"
              sx={{ width: "fit-content", textAlign: "center", lineHeight: 1.2, whiteSpace: "normal" }}
            >
              Add More Images
              <input
                hidden
                type="file"
                multiple
                accept="image/*"
                onChange={(event) => beginEditNewGallerySelection(Array.from(event.target.files ?? []))}
              />
            </Button>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Update status, delete images, or add more. Changes are saved when you click Save in Edit Saree.
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 2, overflowX: "hidden" }}
            >
              <Table size="small" sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 88 }}>Image</TableCell>
                    <TableCell>File</TableCell>
                    <TableCell sx={{ width: { xs: 140, sm: 180 } }}>Availability</TableCell>
                    <TableCell align="right" sx={{ width: 64 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {editExistingGalleryImages.length === 0 && editNewGalleryDraft.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>No gallery images.</TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {editExistingGalleryImages.map((img) => (
                        <TableRow key={img.url}>
                          <TableCell sx={{ width: 88 }}>
                            <Box
                              sx={{
                                position: "relative",
                                width: 64,
                                height: 64,
                                borderRadius: 1.5,
                                overflow: "hidden",
                                cursor: "pointer",
                              }}
                              onMouseEnter={() => {
                                isHoveringRef.current = true;
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                setHoveredImageUrl(img.url);
                              }}
                              onMouseLeave={() => {
                                isHoveringRef.current = false;
                                hoverTimeoutRef.current = setTimeout(() => {
                                  if (!isHoveringRef.current) setHoveredImageUrl(null);
                                }, 150);
                              }}
                            >
                              <Image
                                src={img.url}
                                alt={getFileNameFromUrl(img.url)}
                                fill
                                sizes="64px"
                                style={{ objectFit: "cover" }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              title={getFileNameFromUrl(img.url)}
                              sx={{ whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.2 }}
                            >
                              {getFileNameFromUrl(img.url)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: { xs: 140, sm: 180 } }}>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={img.status ?? "available"}
                              onChange={(event) =>
                                updateExistingGalleryImageStatus(img.url, event.target.value as SareeStatus)
                              }
                            >
                              <MenuItem value="available">Available</MenuItem>
                              <MenuItem value="sold_out">Sold Out</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell align="right" sx={{ width: 64 }}>
                            <Tooltip title="Delete image">
                              <IconButton color="error" onClick={() => removeExistingGalleryImage(img.url)} size="small">
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}

                      {editNewGalleryDraft.map((item, index) => (
                        <TableRow key={`pending-${item.file.name}-${index}`}>
                          <TableCell sx={{ width: 88 }}>
                            <Box
                              component="img"
                              src={item.previewUrl}
                              alt={item.file.name}
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 1.5,
                                objectFit: "cover",
                                border: "1px solid rgba(0,0,0,0.12)",
                                cursor: "pointer",
                              }}
                              onMouseEnter={() => {
                                isHoveringRef.current = true;
                                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                                setHoveredImageUrl(item.previewUrl);
                              }}
                              onMouseLeave={() => {
                                isHoveringRef.current = false;
                                hoverTimeoutRef.current = setTimeout(() => {
                                  if (!isHoveringRef.current) setHoveredImageUrl(null);
                                }, 150);
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              title={item.file.name}
                              sx={{ fontWeight: 600, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.2 }}
                            >
                              {item.file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                              Pending upload
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ width: { xs: 140, sm: 180 } }}>
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={item.status}
                              onChange={(event) =>
                                updateEditNewDraftStatus(index, event.target.value as SareeStatus)
                              }
                            >
                              <MenuItem value="available">Available</MenuItem>
                              <MenuItem value="sold_out">Sold Out</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell align="right" sx={{ width: 64 }}>
                            <Tooltip title="Remove from pending">
                              <IconButton color="error" onClick={() => removeEditNewDraftAt(index)} size="small">
                                <DeleteRoundedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditGalleryManagerOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Backdrop
        open={submitting}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 10,
          color: "#fff",
          flexDirection: "column",
          gap: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      >
        <Stack
          spacing={1.25}
          sx={{
            width: { xs: "84%", sm: 360 },
            maxWidth: "92vw",
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: 2,
            px: 2,
            py: 1.75,
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
          }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Saving changes, please wait...
            </Typography>
          </Stack>
        </Stack>
      </Backdrop>

      {/* Hover Image Preview Backdrop + Modal */}
      {hoveredImageUrl && (
        <>
          <Backdrop
            open={true}
            onClick={() => {
              isHoveringRef.current = false;
              setHoveredImageUrl(null);
            }}
            onMouseEnter={() => {
              isHoveringRef.current = true;
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              isHoveringRef.current = false;
              hoverTimeoutRef.current = setTimeout(() => {
                if (!isHoveringRef.current) {
                  setHoveredImageUrl(null);
                }
              }, 220);
            }}
            sx={{
              zIndex: 9998,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
            }}
          />
          <Box
            sx={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 2,
              padding: 2,
              maxWidth: "90vw",
              maxHeight: "90vh",
              cursor: "pointer",
            }}
            onMouseEnter={() => {
              isHoveringRef.current = true;
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={() => {
              isHoveringRef.current = false;
              hoverTimeoutRef.current = setTimeout(() => {
                if (!isHoveringRef.current) {
                  setHoveredImageUrl(null);
                }
              }, 220);
            }}
            onClick={(e) => {
              e.stopPropagation();
              isHoveringRef.current = false;
              setHoveredImageUrl(null);
            }}
          >
            <Image
              src={hoveredImageUrl}
              alt="Preview"
              width={700}
              height={700}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                borderRadius: "8px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              }}
              priority
            />
          </Box>
        </>
      )}
    </Box>
  );
}
