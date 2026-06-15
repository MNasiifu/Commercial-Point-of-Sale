import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Chip, IconButton, Tooltip, MenuItem, Button, Typography, Select,
  FormControl, InputLabel, Switch, FormControlLabel, Menu, ListItemIcon,
  ListItemText, Divider,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import { SearchTextField } from "@/components/molecules/SearchTextField";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";

import { useProducts, useDeleteProduct } from "@/hooks/products/useProducts";
import { useToggleProductActive } from "@/hooks/products/useProductMutations";
import { useCategories, useGarmentTypes } from "@/hooks/shared/useReferenceData";
import { formatUGX } from "@/lib/formatters";
import type { ProductWithDetails } from "@/services/productService";
import { GENDER_OPTIONS } from "@/lib/zod-schemas/product.schemas";
import { DeleteProductModal } from "./DeleteProductModal";
import { ToggleProductModal } from "./ToggleProductModal";
import { ResponsiveStack, responsiveWidth } from "@/components/molecules/ResponsiveStack";

type ModalState =
  | { kind: "none" }
  | { kind: "delete"; product: ProductWithDetails }
  | { kind: "toggle"; product: ProductWithDetails };

interface RowActionsMenuProps {
  row: ProductWithDetails;
  onViewDetails: (row: ProductWithDetails) => void;
  onEdit: (row: ProductWithDetails) => void;
  onToggleActive: (row: ProductWithDetails) => void;
  onDelete: (row: ProductWithDetails) => void;
}

function RowActionsMenu({ row, onViewDetails, onEdit, onToggleActive, onDelete }: RowActionsMenuProps) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = (e: React.MouseEvent) => { e.stopPropagation(); setOpen(true); };
  const handleClose = (e?: React.MouseEvent | object) => {
    if (e && "stopPropagation" in (e as React.MouseEvent)) (e as React.MouseEvent).stopPropagation();
    setOpen(false);
  };
  const handle = (action: (r: ProductWithDetails) => void) => (e: React.MouseEvent) => {
    e.stopPropagation(); setOpen(false); action(row);
  };

  return (
    <>
      <Tooltip title="More actions" arrow>
        <IconButton ref={anchorRef} size="small" onClick={handleOpen}
          aria-label={`actions for ${row.name}`} aria-haspopup="true" aria-expanded={open}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{ paper: { elevation: 3, sx: { minWidth: 172, borderRadius: 2, mt: 0.5,
          "& .MuiMenuItem-root": { borderRadius: 1, mx: 0.5, my: 0.25, px: 1.5, py: 0.75, fontSize: "0.875rem" } } } }}
      >
        <MenuItem onClick={handle(onViewDetails)}>
          <ListItemIcon sx={{ minWidth: 32 }}><VisibilityIcon fontSize="small" color="primary" /></ListItemIcon>
          <ListItemText primary="View Details" />
        </MenuItem>
        <MenuItem onClick={handle(onEdit)}>
          <ListItemIcon sx={{ minWidth: 32 }}><EditIcon fontSize="small" color="action" /></ListItemIcon>
          <ListItemText primary="Edit" />
        </MenuItem>
        <MenuItem onClick={handle(onToggleActive)}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            {row.is_active ? <ToggleOffIcon fontSize="small" color="warning" /> : <ToggleOnIcon fontSize="small" color="success" />}
          </ListItemIcon>
          <ListItemText primary={row.is_active ? "Deactivate" : "Activate"}
            slotProps={{ primary: { sx: { color: row.is_active ? "warning.main" : "success.main", fontWeight: 500 } } }} />
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handle(onDelete)}>
          <ListItemIcon sx={{ minWidth: 32 }}><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText primary="Delete" slotProps={{ primary: { sx: { color: "error.main", fontWeight: 500 } } }} />
        </MenuItem>
      </Menu>
    </>
  );
}

const GENDER_LABEL: Record<string, string> = { boy: "Boy", girl: "Girl", unisex: "Unisex", newborn: "Newborn" };

export function ProductTable() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [garmentTypeId, setGarmentTypeId] = useState("");
  const [gender, setGender] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [modal, setModal] = useState<ModalState>({ kind: "none" });

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    categoryId: categoryId || undefined,
    garmentTypeId: garmentTypeId || undefined,
    gender: gender || undefined,
    showInactive: showInactive || undefined,
  });
  const { data: categories = [] } = useCategories();
  const { data: garmentTypes = [] } = useGarmentTypes();
  const toggleActive = useToggleProductActive();
  const deleteProduct = useDeleteProduct();

  const handleViewDetails = useCallback((row: ProductWithDetails) => navigate(`/products/${row.id}`), [navigate]);
  const handleEdit = useCallback((row: ProductWithDetails) => navigate(`/products/${row.id}/edit`), [navigate]);
  const handleRequestToggle = useCallback((row: ProductWithDetails) => setModal({ kind: "toggle", product: row }), []);
  const handleRequestDelete = useCallback((row: ProductWithDetails) => setModal({ kind: "delete", product: row }), []);

  const handleClose = useCallback(() => {
    if (toggleActive.isPending || deleteProduct.isPending) return;
    setModal({ kind: "none" });
  }, [toggleActive.isPending, deleteProduct.isPending]);

  const handleConfirmDelete = useCallback(() => {
    if (modal.kind !== "delete") return;
    deleteProduct.mutate(modal.product.id, { onSettled: () => setModal({ kind: "none" }) });
  }, [modal, deleteProduct]);

  const handleConfirmToggle = useCallback(() => {
    if (modal.kind !== "toggle") return;
    const { product } = modal;
    toggleActive.mutate({ id: product.id, isActive: !product.is_active },
      { onSettled: () => setModal({ kind: "none" }) });
  }, [modal, toggleActive]);

  const columns: GridColDef<ProductWithDetails>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Product",
        flex: 1.8,
        minWidth: 200,
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) => {
          const sub = [row.brands?.name, row.garment_types?.name].filter(Boolean).join(" · ");
          return (
            <Box py={0.5}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.3}>{row.name}</Typography>
              {sub && (
                <Typography variant="caption" color="text.secondary" lineHeight={1.2} display="block">{sub}</Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: "category",
        headerName: "Category",
        flex: 1,
        minWidth: 130,
        valueGetter: (_: unknown, row: ProductWithDetails) => row.categories?.name ?? "—",
        renderCell: ({ value }: GridRenderCellParams) =>
          value === "—" ? <Typography variant="caption" color="text.disabled">—</Typography>
            : <Chip label={value} size="small" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.75rem" }} />,
      },
      {
        field: "size",
        headerName: "Size",
        width: 90,
        valueGetter: (_: unknown, row: ProductWithDetails) => row.sizes?.name ?? "—",
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" color={value === "—" ? "text.disabled" : "text.primary"}>{value}</Typography>
        ),
      },
      {
        field: "color",
        headerName: "Color",
        width: 120,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) =>
          row.colors ? (
            <Box display="flex" alignItems="center" gap={0.75}>
              {row.colors.hex_code && (
                <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: row.colors.hex_code,
                           border: "1px solid rgba(0,0,0,0.2)" }} />
              )}
              <Typography variant="body2">{row.colors.name}</Typography>
            </Box>
          ) : <Typography variant="caption" color="text.disabled">—</Typography>,
      },
      {
        field: "gender",
        headerName: "Gender",
        width: 100,
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) =>
          row.gender ? (
            <Chip label={GENDER_LABEL[row.gender]} size="small" variant="outlined"
              sx={{ borderRadius: "6px", fontSize: "0.7rem" }} />
          ) : <Typography variant="caption" color="text.disabled">—</Typography>,
      },
      {
        field: "retail_price",
        headerName: "Retail (UGX)",
        width: 120,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) => (
          <Typography variant="body2" fontWeight={600} fontFamily="monospace">{formatUGX(row.retail_price)}</Typography>
        ),
      },
      {
        field: "wholesale_price",
        headerName: "Wholesale",
        width: 120,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) => (
          <Typography variant="body2" fontFamily="monospace" color="text.secondary">{formatUGX(row.wholesale_price)}</Typography>
        ),
      },
      {
        field: "is_active",
        headerName: "Status",
        width: 90,
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) => (
          <Chip label={row.is_active ? "Active" : "Inactive"} size="small"
            color={row.is_active ? "success" : "default"} variant={row.is_active ? "filled" : "outlined"}
            sx={{ borderRadius: "6px", fontSize: "0.7rem" }} />
        ),
      },
      {
        field: "actions",
        headerName: "",
        width: 56,
        sortable: false,
        filterable: false,
        align: "center",
        renderCell: ({ row }: GridRenderCellParams<ProductWithDetails>) => (
          <RowActionsMenu row={row} onViewDetails={handleViewDetails} onEdit={handleEdit}
            onToggleActive={handleRequestToggle} onDelete={handleRequestDelete} />
        ),
      },
    ],
    [handleViewDetails, handleEdit, handleRequestToggle, handleRequestDelete],
  );

  return (
    <Box>
      <ResponsiveStack spacing={1.5} mb={2}>
        <SearchTextField
          placeholder="Search by name or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 380 } }}
        />
        <Button variant={showFilters ? "contained" : "outlined"} size="small" startIcon={<FilterListIcon />}
          onClick={() => setShowFilters((v) => !v)} sx={{ ...responsiveWidth(), whiteSpace: "nowrap", flexShrink: 0 }}>
          Filters
        </Button>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate("/products/new")}
          sx={{ ...responsiveWidth(), whiteSpace: "nowrap", flexShrink: 0 }}>
          Add Product
        </Button>
      </ResponsiveStack>

      {showFilters && (
        <ResponsiveStack spacing={1.5} mb={2} flexWrap="wrap">
          <FormControl size="small" sx={responsiveWidth(160)}>
            <InputLabel>Category</InputLabel>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} label="Category">
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={responsiveWidth(160)}>
            <InputLabel>Type</InputLabel>
            <Select value={garmentTypeId} onChange={(e) => setGarmentTypeId(e.target.value)} label="Type">
              <MenuItem value="">All types</MenuItem>
              {garmentTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={responsiveWidth(140)}>
            <InputLabel>Gender</InputLabel>
            <Select value={gender} onChange={(e) => setGender(e.target.value)} label="Gender">
              <MenuItem value="">All</MenuItem>
              {GENDER_OPTIONS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
            label={<Typography variant="body2">Show inactive</Typography>}
            sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
          />
        </ResponsiveStack>
      )}

      <AppDataGrid
        rows={products}
        columns={columns}
        loading={isLoading}
        onRowClick={({ row }) => navigate(`/products/${row.id}`)}
      />

      <DeleteProductModal
        open={modal.kind === "delete"}
        product={modal.kind === "delete" ? modal.product : null}
        isPending={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onClose={handleClose}
      />
      <ToggleProductModal
        open={modal.kind === "toggle"}
        product={modal.kind === "toggle" ? modal.product : null}
        isPending={toggleActive.isPending}
        onConfirm={handleConfirmToggle}
        onClose={handleClose}
      />
    </Box>
  );
}
