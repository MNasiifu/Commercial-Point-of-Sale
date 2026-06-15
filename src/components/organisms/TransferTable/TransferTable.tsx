import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, Chip, FormControl, InputLabel, MenuItem, Select, Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import { ResponsiveStack, responsiveWidth } from "@/components/molecules/ResponsiveStack";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { TransferForm } from "@/components/organisms/TransferForm/TransferForm";
import { useTransfers } from "@/hooks/inventory/useTransfers";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatDateTime } from "@/lib/formatters";
import type { TransferRow } from "@/services/transferService";
import type { StockTransferStatus } from "@/types/database.types";

export const TRANSFER_STATUS_COLOR: Record<
  StockTransferStatus,
  "warning" | "success" | "default" | "error"
> = {
  draft: "default",
  sent: "warning",
  received: "success",
  cancelled: "error",
};

export function TransferTable() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );

  const { data: rows = [], isLoading } = useTransfers(
    { status: (status || undefined) as StockTransferStatus | undefined },
    branchId,
  );

  const columns: GridColDef<TransferRow>[] = useMemo(
    () => [
      {
        field: "transfer_number",
        headerName: "Transfer #",
        width: 170,
        renderCell: ({ row }: GridRenderCellParams<TransferRow>) => (
          <Typography variant="body2" fontWeight={600} fontFamily="monospace">{row.transfer_number}</Typography>
        ),
      },
      {
        field: "route",
        headerName: "From → To",
        flex: 1.4,
        minWidth: 220,
        renderCell: ({ row }: GridRenderCellParams<TransferRow>) => (
          <Box display="flex" alignItems="center" gap={0.75}>
            <Typography variant="body2">{row.from_branch?.name ?? "—"}</Typography>
            <SwapHorizIcon fontSize="small" color="action" />
            <Typography variant="body2" fontWeight={600}>{row.to_branch?.name ?? "—"}</Typography>
          </Box>
        ),
      },
      {
        field: "items_count",
        headerName: "Items",
        width: 90,
        align: "right",
        headerAlign: "right",
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: ({ row }: GridRenderCellParams<TransferRow>) => (
          <Chip label={row.status} size="small" color={TRANSFER_STATUS_COLOR[row.status]}
            variant={row.status === "received" ? "filled" : "outlined"}
            sx={{ borderRadius: "6px", fontSize: "0.7rem", textTransform: "capitalize" }} />
        ),
      },
      {
        field: "sent_at",
        headerName: "Sent",
        width: 170,
        renderCell: ({ row }: GridRenderCellParams<TransferRow>) => (
          <Typography variant="body2" color="text.secondary">
            {row.sent_at ? formatDateTime(row.sent_at) : "—"}
          </Typography>
        ),
      },
      {
        field: "received_at",
        headerName: "Received",
        width: 170,
        renderCell: ({ row }: GridRenderCellParams<TransferRow>) => (
          <Typography variant="body2" color="text.secondary">
            {row.received_at ? formatDateTime(row.received_at) : "—"}
          </Typography>
        ),
      },
    ],
    [],
  );

  return (
    <Box>
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }} gap={{ xs: 1.5, sm: 0 }} mb={3}>
        <Box flex={{ sm: 1 }}>
          <Typography variant="h5" fontWeight={700}>Stock Transfers</Typography>
          <Typography variant="body2" color="text.secondary">
            Move stock from the main store to branches, and returns back to main.
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)} sx={{ width: { xs: "100%", sm: "auto" } }}>
          New Transfer
        </Button>
      </Box>

      <ResponsiveStack spacing={1.5} mb={2} flexWrap="wrap">
        <BranchSelect value={branchId} onChange={setBranchId} />
        <FormControl size="small" sx={responsiveWidth(160)}>
          <InputLabel>Status</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="Status">
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="sent">Sent (in transit)</MenuItem>
            <MenuItem value="received">Received</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </ResponsiveStack>

      <AppDataGrid
        rows={rows}
        columns={columns}
        loading={isLoading}
        onRowClick={({ row }) => navigate(`/inventory/transfers/${row.id}`)}
      />

      <TransferForm open={formOpen} onClose={() => setFormOpen(false)} />
    </Box>
  );
}
