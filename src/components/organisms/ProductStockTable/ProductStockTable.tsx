import { useState, useMemo } from "react";
import {
  Box, Chip, FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import { SearchTextField } from "@/components/molecules/SearchTextField";
import { ResponsiveStack, responsiveWidth } from "@/components/molecules/ResponsiveStack";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { useProductStock } from "@/hooks/inventory/useInventory";
import { useCategories } from "@/hooks/shared/useReferenceData";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatUGX } from "@/lib/formatters";
import { LOW_STOCK_THRESHOLD, type ProductStockRow } from "@/services/inventoryService";

export function ProductStockTable() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [showOutOfStock, setShowOutOfStock] = useState(true);
  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );

  const { data: rows = [], isLoading } = useProductStock(
    {
      search: search || undefined,
      categoryId: categoryId || undefined,
      lowStockOnly: lowStockOnly || undefined,
      showOutOfStock,
    },
    branchId,
  );
  const { data: categories = [] } = useCategories();

  const columns: GridColDef<ProductStockRow>[] = useMemo(
    () => [
      {
        field: "product_name",
        headerName: "Product",
        flex: 1.5,
        minWidth: 230,
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => {
          const sub = [row.brand_name, row.size_name, row.color_name].filter(Boolean).join(" · ");
          return (
            <Box py={0.5}>
              <Typography variant="body2" fontWeight={600} lineHeight={1.3}>{row.product_name}</Typography>
              {sub && <Typography variant="caption" color="text.secondary" display="block">{sub}</Typography>}
            </Box>
          );
        },
      },
      {
        field: "category_name",
        headerName: "Category",
        flex: 1,
        minWidth: 190,
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) =>
          row.category_name
            ? <Chip label={row.category_name} size="small" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.72rem" }} />
            : <Typography variant="caption" color="text.disabled">—</Typography>,
      },
      {
        field: "quantity",
        headerName: "On hand",
        width: 140,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => {
          const out = row.quantity === 0;
          const low = row.quantity > 0 && row.quantity <= LOW_STOCK_THRESHOLD;
          return (
            <Box display="flex" alignItems="center" gap={0.75} justifyContent="flex-end" width="100%">
              <Typography variant="body2" fontWeight={700} fontFamily="monospace"
                color={out ? "error.main" : low ? "warning.main" : "text.primary"}>
                {row.quantity}
              </Typography>
              {out && <Chip label="Out" size="small" color="error" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.65rem" }} />}
              {low && <Chip label="Low" size="small" color="warning" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.65rem" }} />}
            </Box>
          );
        },
      },
      {
        field: "cost_price",
        headerName: "Cost price",
        width: 190,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => (
          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
            {formatUGX(row.cost_price)}
          </Typography>
        ),
      },
      {
        field: "retail_price",
        headerName: "Retail price",
        width: 190,
        align: "right",
        headerAlign: "right",
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => (
          <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
            {formatUGX(row.retail_price)}
          </Typography>
        ),
      },
      {
        field: "margin",
        headerName: "Margin",
        width: 190,
        align: "right",
        headerAlign: "right",
        valueGetter: (_: unknown, row: ProductStockRow) => row.retail_price - row.cost_price,
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => {
          const margin = row.retail_price - row.cost_price;
          return (
            <Typography
              variant="body2"
              fontFamily="monospace"
              color={margin > 0 ? "success.main" : margin < 0 ? "error.main" : "text.secondary"}
            >
              {formatUGX(margin)}
            </Typography>
          );
        },
      },
      {
        field: "stock_value",
        headerName: "Stock value",
        width: 190,
        align: "right",
        headerAlign: "right",
        valueGetter: (_: unknown, row: ProductStockRow) => row.quantity * row.cost_price,
        renderCell: ({ row }: GridRenderCellParams<ProductStockRow>) => (
          <Typography variant="body2" fontFamily="monospace" color="text.secondary">
            {formatUGX(row.quantity * row.cost_price)}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <Box>
      <ResponsiveStack spacing={1.5} mb={2} flexWrap="wrap">
        <SearchTextField
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 320 } }}
        />
        <BranchSelect value={branchId} onChange={setBranchId} />
        <FormControl size="small" sx={responsiveWidth(160)}>
          <InputLabel>Category</InputLabel>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} label="Category">
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch size="small" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />}
          label={<Typography variant="body2">Low stock only</Typography>}
        />
        <FormControlLabel
          control={<Switch size="small" checked={showOutOfStock} onChange={(e) => setShowOutOfStock(e.target.checked)} />}
          label={<Typography variant="body2">Show zero stock</Typography>}
        />
      </ResponsiveStack>

      <AppDataGrid getRowId={(r) => r.product_id} rows={rows} columns={columns} loading={isLoading} />
    </Box>
  );
}
