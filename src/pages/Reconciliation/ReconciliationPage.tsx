import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { ReconciliationForm } from "@/components/organisms/ReconciliationForm/ReconciliationForm";
import { useReconciliations } from "@/hooks/reconciliation/useReconciliation";
import { formatDate, formatUGX, formatDateInput } from "@/lib/formatters";
import type {
  DailyReconciliation,
  ReconciliationStatus,
} from "@/types/database.types";

const STATUS_CONFIG: Record<
  ReconciliationStatus,
  { label: string; color: "default" | "warning" | "success" | "info" }
> = {
  open: { label: "Open", color: "default" },
  submitted: { label: "Submitted", color: "warning" },
  approved: { label: "Approved", color: "success" },
};

function varianceColor(variance: number) {
  if (variance === 0) return "success.main";
  if (variance < 0) return "error.main";
  return "warning.main";
}

export function ReconciliationPage() {
  const navigate = useNavigate();
  const today = formatDateInput(new Date().toISOString());
  const [formDate, setFormDate] = useState<string | null>(null);
  const formOpen = !!formDate;

  const { data: records = [], isLoading } = useReconciliations();

  // const columns: GridColDef<DailyReconciliation>[] = useMemo(() => [
  //   {
  //     field: 'reconciliation_date', headerName: 'Date', width: 250,
  //     renderCell: ({ value }: GridRenderCellParams) => (
  //       <Typography variant="body2" fontWeight={600}>{formatDate(value as string)}</Typography>
  //     ),
  //   },
  //   {
  //     field: 'status', headerName: 'Status', width: 200,
  //     renderCell: ({ value }: GridRenderCellParams) => {
  //       const cfg = STATUS_CONFIG[value as ReconciliationStatus] ?? { label: value, color: 'default' }
  //       return (
  //         <Chip label={cfg.label} size="small" color={cfg.color} variant="filled"
  //           sx={{ borderRadius: '6px', fontSize: '0.7rem' }} />
  //       )
  //     },
  //   },
  //   {
  //     field: 'total_expected', headerName: 'Expected', width: 150, align: 'right', headerAlign: 'right',
  //     renderCell: ({ value }: GridRenderCellParams) => (
  //       <Typography variant="body2" fontFamily="monospace">{formatUGX(value as number)}</Typography>
  //     ),
  //   },
  //   {
  //     field: 'total_actual', headerName: 'Actual', width: 150, align: 'right', headerAlign: 'right',
  //     renderCell: ({ value }: GridRenderCellParams) => (
  //       <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{formatUGX(value as number)}</Typography>
  //     ),
  //   },
  //   {
  //     field: 'total_variance', headerName: 'Variance', width: 150, align: 'right', headerAlign: 'right',
  //     renderCell: ({ value }: GridRenderCellParams) => {
  //       const v = value as number
  //       return (
  //         <Typography variant="body2" fontFamily="monospace" fontWeight={700} color={varianceColor(v)}>
  //           {v >= 0 ? '+' : ''}{formatUGX(v)}
  //         </Typography>
  //       )
  //     },
  //   },
  //   {
  //     field: 'actions', headerName: '', width: 100, sortable: false,
  //     renderCell: ({ row }: GridRenderCellParams<DailyReconciliation>) => (
  //       <Tooltip title="View details" arrow>
  //         <IconButton size="small"
  //           onClick={(e) => { e.stopPropagation(); navigate(`/reports/reconciliation/${row.id}`) }}>
  //           <VisibilityIcon fontSize="small" />
  //         </IconButton>
  //       </Tooltip>
  //     ),
  //   },
  // ], [navigate])

  const columns: GridColDef<DailyReconciliation>[] = useMemo(
    () => [
      {
        field: "reconciliation_date",
        headerName: "Date",
        // ── CHANGED: replaced fixed `width: 250` with `flex: 2` so this
        //    column takes proportionally more space (it's the primary label).
        flex: 2,
        minWidth: 160,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" fontWeight={600}>
            {formatDate(value as string)}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        // ── CHANGED: was `width: 200`, now proportional flex column.
        flex: 1.5,
        minWidth: 120,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }: GridRenderCellParams) => {
          const cfg = STATUS_CONFIG[value as ReconciliationStatus] ?? {
            label: value,
            color: "default",
          };
          return (
            <Chip
              label={cfg.label}
              size="small"
              color={cfg.color}
              variant="filled"
              sx={{ borderRadius: "6px", fontSize: "0.7rem" }}
            />
          );
        },
      },
      {
        field: "total_expected",
        headerName: "Expected",
        // ── CHANGED: was `width: 150`. Numeric columns get equal flex so
        //    the three money columns align symmetrically.
        flex: 1.5,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" fontFamily="monospace">
            {formatUGX(value as number)}
          </Typography>
        ),
      },
      {
        field: "total_actual",
        headerName: "Actual",
        // ── CHANGED: was `width: 150`.
        flex: 1.5,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
            {formatUGX(value as number)}
          </Typography>
        ),
      },
      {
        field: "total_variance",
        headerName: "Variance",
        // ── CHANGED: was `width: 150`.
        flex: 1.5,
        minWidth: 130,
        align: "center",
        headerAlign: "center",
        renderCell: ({ value }: GridRenderCellParams) => {
          const v = value as number;
          return (
            <Typography
              variant="body2"
              fontFamily="monospace"
              fontWeight={700}
              color={varianceColor(v)}
            >
              {v >= 0 ? "+" : ""}
              {formatUGX(v)}
            </Typography>
          );
        },
      },
      {
        field: "actions",
        headerName: "",
        // ── KEPT narrow but switched to minWidth + no flex so the icon
        //    column stays compact while everything else stretches.
        width: 64,
        minWidth: 64,
        sortable: false,
        disableColumnMenu: true,
        renderCell: ({ row }: GridRenderCellParams<DailyReconciliation>) => (
          <Tooltip title="View details" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/reports/reconciliation/${row.id}`);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [navigate],
  );

  const handleDone = (id: string) => {
    setFormDate(null);
    navigate(`/reports/reconciliation/${id}`);
  };

  return (
    <DashboardTemplate>
      <Box
        display="flex"
        alignItems="center"
        mb={3}
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>
            Daily Reconciliation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compare system totals against physical cash counts and mobile money
            statements.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setFormDate(today)}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Open today's reconciliation
        </Button>
      </Box>

      <AppDataGrid
        rows={records}
        columns={columns}
        loading={isLoading}
        onRowClick={({ row }) => navigate(`/reports/reconciliation/${row.id}`)}
        pageSizeOptions={[25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
          sorting: {
            sortModel: [{ field: "reconciliation_date", sort: "desc" }],
          },
        }}
      />

      {/* Reconciliation form dialog */}
      <Dialog
        open={formOpen}
        onClose={() => setFormDate(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight={700} flex={1}>
            Reconciliation — {formDate ? formatDate(formDate) : ""}
          </Typography>
          <IconButton size="small" onClick={() => setFormDate(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {formDate && (
            <ReconciliationForm date={formDate} onDone={handleDone} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardTemplate>
  );
}
