import { useState, useMemo } from "react";
import { Box, Chip, MenuItem, Typography, Button, FormControl, InputLabel, Select } from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import AddIcon from "@mui/icons-material/Add";

import { StockAdjustmentForm } from "@/components/organisms/StockAdjustmentForm/StockAdjustmentForm";
import { SearchTextField } from "@/components/molecules/SearchTextField";
import { ResponsiveStack, responsiveWidth } from "@/components/molecules/ResponsiveStack";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { useStockAdjustments } from "@/hooks/inventory/useInventory";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatDate } from "@/lib/formatters";
import { ADJUSTMENT_LABELS } from "@/lib/zod-schemas/inventory.schemas";
import type { AdjustmentRow } from "@/services/inventoryService";
import type { AdjustmentType } from "@/types/database.types";

const TYPE_COLORS: Record<string, "error" | "warning" | "info" | "success" | "default"> = {
  damage: "error",
  theft: "error",
  correction: "info",
  transfer_loss: "warning",
  other: "default",
};

export function StockAdjustmentTable() {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );

  const { data: adjustments = [], isLoading } = useStockAdjustments(
    {
      search: search || undefined,
      adjustmentType: (typeFilter || undefined) as AdjustmentType | undefined,
    },
    branchId,
  );

  const columns: GridColDef<AdjustmentRow>[] = useMemo(
    () => [
      {
        field: "created_at",
        headerName: "Date",
        width: 150,
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2">{formatDate(value as string)}</Typography>
        ),
      },
      {
        field: "product_name",
        headerName: "Product",
        flex: 1,
        minWidth: 180,
        renderCell: ({ row }: GridRenderCellParams<AdjustmentRow>) => (
          <Typography variant="body2" fontWeight={600}>{row.product_name ?? "—"}</Typography>
        ),
      },
      {
        field: "branch_name",
        headerName: "Branch",
        width: 130,
        renderCell: ({ row }: GridRenderCellParams<AdjustmentRow>) => (
          <Typography variant="body2" color="text.secondary">{row.branch_name ?? "—"}</Typography>
        ),
      },
      {
        field: "adjustment_type",
        headerName: "Type",
        width: 150,
        renderCell: ({ value }: GridRenderCellParams) => {
          const type = value as string;
          return (
            <Chip label={ADJUSTMENT_LABELS[type] ?? type} size="small"
              color={TYPE_COLORS[type] ?? "default"} variant="outlined"
              sx={{ borderRadius: "6px", fontSize: "0.7rem" }} />
          );
        },
      },
      {
        field: "quantity",
        headerName: "Qty",
        width: 100,
        align: "right",
        headerAlign: "right",
        renderCell: ({ value }: GridRenderCellParams) => {
          const qty = value as number;
          return (
            <Typography variant="body2" fontWeight={700} fontFamily="monospace"
              color={qty < 0 ? "error.main" : "success.main"}>
              {qty > 0 ? "+" : ""}{qty}
            </Typography>
          );
        },
      },
      {
        field: "reason",
        headerName: "Reason",
        flex: 1,
        minWidth: 160,
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" noWrap title={(value as string) ?? ""}>{value as string}</Typography>
        ),
      },
      {
        field: "adjusted_by_name",
        headerName: "Adjusted By",
        width: 150,
        renderCell: ({ row }: GridRenderCellParams<AdjustmentRow>) => (
          <Typography variant="body2" color="text.secondary">{row.adjusted_by_name ?? "—"}</Typography>
        ),
      },
    ],
    [],
  );

  const typeOptions = Object.entries(ADJUSTMENT_LABELS).map(([value, label]) => ({ value, label }));

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }} gap={{ xs: 1.5, sm: 0 }} mb={3}>
        <Box flex={{ sm: 1 }} width={{ xs: "100%", sm: "auto" }}>
          <Typography variant="h5" fontWeight={700}>Stock Adjustments</Typography>
          <Typography variant="body2" color="text.secondary">
            History of manual stock changes (damage, theft, corrections).
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)} sx={{ width: { xs: "100%", sm: "auto" } }}>
          New Adjustment
        </Button>
      </Box>

      <ResponsiveStack spacing={1.5} mb={2} flexWrap="wrap">
        <SearchTextField
          placeholder="Search by product or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 360 } }}
        />
        <BranchSelect value={branchId} onChange={setBranchId} />
        <FormControl size="small" sx={responsiveWidth(160)}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Type">
            <MenuItem value="">All types</MenuItem>
            {typeOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </ResponsiveStack>

      <AppDataGrid rows={adjustments} columns={columns} loading={isLoading} />

      <StockAdjustmentForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
