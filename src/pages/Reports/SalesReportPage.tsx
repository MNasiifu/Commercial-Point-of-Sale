import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert, Box, Button, Chip, CircularProgress, FormControl, IconButton,
  InputLabel, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { AppDataGrid } from "@/components/molecules/AppDataGrid";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import TableChartIcon from "@mui/icons-material/TableChart";
import PrintIcon from "@mui/icons-material/Print";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { useSalesReport, useTellers } from "@/hooks/reports/useReports";
import { useCategories } from "@/hooks/shared/useReferenceData";
import { useAuth } from "@/hooks/auth/useAuth";
import { downloadExcel } from "@/lib/reports/exportExcel";
import { printReport } from "@/lib/reports/exportPdf";
import { formatUGX, formatDateTime, formatDateInput, formatPaymentMethod } from "@/lib/formatters";
import type { SalesReportRow, SalesReportItem, SalesReportFilters } from "@/services/reportService";
import type { PriceTier, SaleType } from "@/types/database.types";

const SALE_TYPE_LABELS: Record<SaleType, string> = {
  walk_in: "Walk-in",
  account: "Account",
  delivery: "Delivery",
};

const PRICE_TIER_LABELS: Record<PriceTier, string> = {
  retail: "Retail",
  wholesale: "Wholesale",
};

/** A grid row is either a real sale or a synthetic detail row carrying the same data. */
type GridRow = SalesReportRow & { __detail?: boolean };

/** Total grid columns (expand toggle + 8 data columns) — used for the detail row colSpan. */
const COLUMN_COUNT = 9;

/** Inline products sub-table rendered beneath an expanded transaction row. */
function ExpandedItems({ row }: { row: SalesReportRow }) {
  const items = row.items ?? [];
  return (
    <Box sx={{ width: "100%", py: 1.25, pl: 6, pr: 2, bgcolor: "action.hover" }}>
      <Typography variant="caption" color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 700, fontSize: "0.65rem" }}>
        Products — {row.sale_number}
      </Typography>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>No items recorded.</Typography>
      ) : (
        <Table size="small" sx={{ mt: 0.5, maxWidth: 720, "& td, & th": { border: 0, py: 0.5 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Product</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Qty</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Unit price</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Tier</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.7rem" }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((it, i) => (
              <TableRow key={`${it.product_name}-${i}`}>
                <TableCell sx={{ fontSize: "0.75rem" }}>{it.product_name}</TableCell>
                <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{it.quantity}</TableCell>
                <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{formatUGX(it.unit_price)}</TableCell>
                <TableCell sx={{ fontSize: "0.75rem" }}>
                  {it.price_tier === "wholesale"
                    ? <Chip label="Wholesale" size="small" color="success" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.6rem", height: 18 }} />
                    : <Typography variant="caption" color="text.secondary">Retail</Typography>}
                </TableCell>
                <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 700 }}>{formatUGX(it.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Box>
  );
}

function monthStart() {
  const d = new Date();
  return formatDateInput(new Date(d.getFullYear(), d.getMonth(), 1).toISOString());
}

function StatCard({ label, value, accent = "text.primary", mono = false }: {
  label: string;
  value: string;
  accent?: string;
  mono?: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 2, py: 1.5, borderRadius: 2,
        position: "relative", overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
        "&:hover": { borderColor: "primary.main", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
        "&::before": {
          content: '""', position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          bgcolor: accent === "text.primary" ? "primary.main" : accent,
        },
      }}
    >
      <Typography variant="caption" color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.6, fontSize: "0.65rem", fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800} color={accent}
        fontFamily={mono ? "monospace" : undefined} sx={{ mt: 0.25, lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export function SalesReportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, branchId: ownBranch } = useAuth();

  const [filters, setFilters] = useState<SalesReportFilters>({
    dateFrom: monthStart(),
    dateTo: formatDateInput(new Date().toISOString()),
    branchId: role === "admin" ? null : ownBranch,
    tellerId: null,
    saleType: "",
    categoryId: null,
  });
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data: rows = [], isLoading, isError, refetch } = useSalesReport(filters, enabled);

  const toggleExpand = useCallback((saleNumber: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(saleNumber)) next.delete(saleNumber);
      else next.add(saleNumber);
      return next;
    });
  }, []);
  const { data: tellers = [] } = useTellers();
  const { data: categories = [] } = useCategories();

  const activeCategoryName = filters.categoryId
    ? categories.find((c) => c.id === filters.categoryId)?.name ?? null
    : null;

  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["report-sales"], exact: false });
    return () => { queryClient.removeQueries({ queryKey: ["report-sales"], exact: false }); };
  }, [queryClient]);

  const handleRun = () => { if (enabled) refetch(); else setEnabled(true); };

  const columns: GridColDef<GridRow>[] = useMemo(
    () => [
      {
        field: "__expand",
        headerName: "",
        width: 48,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        // A detail row spans the entire grid width to host the products sub-table.
        colSpan: (_value, row) => (row.__detail ? COLUMN_COUNT : 1),
        renderCell: (params: GridRenderCellParams<GridRow>) => {
          if (params.row.__detail) return <ExpandedItems row={params.row} />;
          const open = expanded.has(params.row.sale_number);
          return (
            <IconButton
              size="small"
              aria-label={open ? "Collapse products" : "Expand products"}
              onClick={(e) => { e.stopPropagation(); toggleExpand(params.row.sale_number); }}
            >
              {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
            </IconButton>
          );
        },
      },
      { field: "sale_date", headerName: "Date", width: 160, flex: 1, valueFormatter: (v: string) => formatDateTime(v) },
      { field: "branch_name", headerName: "Branch", width: 130 },
      { field: "teller_name", headerName: "Teller", flex: 1, minWidth: 120 },
      {
        field: "sale_type",
        headerName: "Type",
        width: 100,
        renderCell: ({ value }: GridRenderCellParams) => (
          <Chip label={SALE_TYPE_LABELS[value as SaleType] ?? value} size="small" variant="outlined"
            sx={{ borderRadius: "6px", fontSize: "0.7rem" }} />
        ),
      },
      { field: "items_count", headerName: "Items", width: 70, align: "right", headerAlign: "right" },
      {
        field: "has_wholesale",
        headerName: "Tier",
        width: 110,
        renderCell: ({ row }: GridRenderCellParams<SalesReportRow>) =>
          row.has_wholesale
            ? <Chip label="Wholesale" size="small" color="success" variant="outlined" sx={{ borderRadius: "6px", fontSize: "0.65rem" }} />
            : <Typography variant="caption" color="text.secondary">Retail</Typography>,
      },
      {
        field: "total_amount",
        headerName: "Total",
        width: 130,
        align: "right",
        headerAlign: "right",
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" fontWeight={700} fontFamily="monospace">{formatUGX(value as number)}</Typography>
        ),
      },
      {
        field: "payment_methods",
        headerName: "Payment",
        width: 160,
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="caption">
            {((value as string) ?? "").split(", ").filter(Boolean).map(formatPaymentMethod).join(", ")}
          </Typography>
        ),
      },
    ],
    [expanded, toggleExpand],
  );

  // Flatten sales into grid rows, injecting a synthetic detail row after each
  // expanded sale. The free Community DataGrid has no native master-detail, so
  // the detail row spans all columns (via colSpan) to host the products table.
  // Caveat: detail rows count toward pagination and follow their parent under
  // sorting (stable insertion order), which is acceptable for this report.
  const gridRows: GridRow[] = useMemo(() => {
    const out: GridRow[] = [];
    for (const r of rows) {
      out.push(r);
      if (expanded.has(r.sale_number)) out.push({ ...r, __detail: true });
    }
    return out;
  }, [rows, expanded]);

  const totalRevenue = rows.filter((r) => !r.is_voided).reduce((s, r) => s + r.total_amount, 0);
  const wholesaleCount = rows.filter((r) => !r.is_voided && r.has_wholesale).length;
  const voidedCount = rows.filter((r) => r.is_voided).length;

  const handleExportExcel = async () => {
    await downloadExcel(
      "Sales Report",
      [
        { header: "Sale #", key: "sale_number", width: 20 },
        { header: "Date", key: "sale_date", width: 22 },
        { header: "Branch", key: "branch_name", width: 16 },
        { header: "Teller", key: "teller_name", width: 20 },
        { header: "Customer", key: "customer_name", width: 22 },
        { header: "Type", key: "sale_type", width: 12 },
        { header: "Items", key: "items_count", width: 8 },
        { header: "Wholesale", key: "has_wholesale", width: 12 },
        { header: "Total", key: "total_amount", width: 16, numFmt: "#,##0" },
        { header: "Payment", key: "payment_methods", width: 22 },
        { header: "Voided", key: "is_voided", width: 10 },
      ],
      rows.map((r) => ({ ...r, sale_date: formatDateTime(r.sale_date) })) as Record<string, unknown>[],
      `Sales_${filters.dateFrom}_to_${filters.dateTo}.xlsx`,
      {
        Period: `${filters.dateFrom} to ${filters.dateTo}`,
        ...(activeCategoryName ? { Category: activeCategoryName } : {}),
        Generated: new Date().toLocaleString("en-UG"),
      },
      // Second sheet: one row per product line, joinable to the Sales sheet by Sale #.
      [
        {
          sheetName: "Line Items",
          columns: [
            { header: "Sale #", key: "sale_number", width: 20 },
            { header: "Date", key: "sale_date", width: 22 },
            { header: "Branch", key: "branch_name", width: 16 },
            { header: "Product", key: "product_name", width: 30 },
            { header: "Qty", key: "quantity", width: 8, numFmt: "#,##0" },
            { header: "Unit Price", key: "unit_price", width: 14, numFmt: "#,##0" },
            { header: "Tier", key: "price_tier", width: 12 },
            { header: "Amount", key: "amount", width: 16, numFmt: "#,##0" },
          ],
          rows: rows.flatMap((r) =>
            r.items.map((it) => ({
              sale_number:  r.sale_number,
              sale_date:    formatDateTime(r.sale_date),
              branch_name:  r.branch_name,
              product_name: it.product_name,
              quantity:     it.quantity,
              unit_price:   it.unit_price,
              price_tier:   PRICE_TIER_LABELS[it.price_tier] ?? it.price_tier,
              amount:       it.amount,
            })),
          ),
        },
      ],
    );
  };

  const handlePrint = () => {
    printReport({
      title: "Sales Report",
      meta: {
        Period: `${filters.dateFrom} to ${filters.dateTo}`,
        ...(activeCategoryName ? { Category: activeCategoryName } : {}),
      },
      summary: [
        { label: "Total Revenue", value: formatUGX(totalRevenue) },
        { label: "Transactions", value: String(rows.length - voidedCount) },
        { label: "Wholesale sales", value: String(wholesaleCount) },
        { label: "Voided", value: String(voidedCount) },
      ],
      columns: [
        { header: "Sale #", key: "sale_number" },
        { header: "Date", key: "sale_date", render: (v) => formatDateTime(v as string) },
        { header: "Branch", key: "branch_name" },
        { header: "Teller", key: "teller_name" },
        { header: "Customer", key: "customer_name" },
        { header: "Type", key: "sale_type" },
        { header: "Wholesale", key: "has_wholesale", render: (v) => (v ? "Yes" : "No") },
        { header: "Total", key: "total_amount", align: "right", render: (v) => formatUGX(v as number) },
        { header: "Payment", key: "payment_methods" },
        { header: "Voided", key: "is_voided", render: (v) => (v ? '<span class="badge badge-red">Yes</span>' : "No") },
      ],
      rows: rows as unknown as Record<string, unknown>[],
      // Per-transaction products rendered as an indented sub-table under each row.
      expandable: {
        columns: [
          { header: "Product", key: "product_name" },
          { header: "Qty", key: "quantity", align: "right" },
          { header: "Unit price", key: "unit_price", align: "right", render: (v) => formatUGX(v as number) },
          { header: "Tier", key: "price_tier", render: (v) => PRICE_TIER_LABELS[v as PriceTier] ?? String(v) },
          { header: "Amount", key: "amount", align: "right", render: (v) => formatUGX(v as number) },
        ],
        getRows: (row) => (row.items as SalesReportItem[] | undefined ?? []) as unknown as Record<string, unknown>[],
        emptyText: "No items recorded.",
      },
    });
  };

  return (
    <DashboardTemplate>
      <Box display="flex" flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }} gap={1.5} mb={3}>
        <Box display="flex" alignItems="center" gap={1} width={{ xs: "100%", sm: "auto" }}>
          <Tooltip title="Back to reports" arrow>
            <IconButton size="small" onClick={() => navigate("/reports")}><ArrowBackIcon /></IconButton>
          </Tooltip>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: "block", sm: "none" } }}>Sales Report</Typography>
        </Box>
        <Box flex={{ sm: 1 }} width={{ xs: "100%", sm: "auto" }}>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: "none", sm: "block" } }}>Sales Report</Typography>
          <Typography variant="body2" color="text.secondary">Transactions with retail/wholesale tier and payment breakdown.</Typography>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} width={{ xs: "100%", sm: "auto" }}>
          <Button size="small" variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportExcel}
            disabled={rows.length === 0} sx={{ width: { xs: "100%", sm: "auto" } }}>Excel</Button>
          <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}
            disabled={rows.length === 0} sx={{ width: { xs: "100%", sm: "auto" } }}>PDF</Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
        <Box sx={{ display: "grid", gap: 1.5, alignItems: "center",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" } }}>
          <TextField label="From" type="date" size="small" fullWidth value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" fullWidth value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} InputLabelProps={{ shrink: true }} />
          {role === "admin" && (
            <BranchSelect value={filters.branchId} onChange={(v) => setFilters((f) => ({ ...f, branchId: v }))} />
          )}
          <FormControl size="small" fullWidth>
            <InputLabel>Teller</InputLabel>
            <Select value={filters.tellerId ?? ""} label="Teller"
              onChange={(e) => setFilters((f) => ({ ...f, tellerId: e.target.value || null }))}>
              <MenuItem value="">All tellers</MenuItem>
              {tellers.map((t) => <MenuItem key={t.id} value={t.id}>{t.full_name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Sale type</InputLabel>
            <Select value={filters.saleType ?? ""} label="Sale type"
              onChange={(e) => setFilters((f) => ({ ...f, saleType: e.target.value as SaleType | "" }))}>
              <MenuItem value="">All types</MenuItem>
              {(Object.entries(SALE_TYPE_LABELS) as [SaleType, string][]).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={filters.categoryId ?? ""} label="Category"
              onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value || null }))}>
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" size="small" fullWidth
            sx={{ gridColumn: { xs: "1 / -1" }, alignSelf: "stretch" }}
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRun} disabled={isLoading}>Run report</Button>
        </Box>
      </Paper>

      {enabled && activeCategoryName && (
        <Box mb={2} px={0.5}>
          <Chip
            label={`Category: ${activeCategoryName}`}
            size="small"
            color="primary"
            variant="outlined"
            onDelete={() => setFilters((f) => ({ ...f, categoryId: null }))}
            sx={{ borderRadius: "6px", fontWeight: 600 }}
          />
        </Box>
      )}

      {rows.length > 0 && enabled && (
        <Box sx={{ display: "grid", gap: 1.5, mb: 2.5,
          gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: `repeat(${voidedCount > 0 ? 4 : 3}, 1fr)` } }}>
          <StatCard label="Total revenue" value={formatUGX(totalRevenue)} mono />
          <StatCard label="Transactions" value={String(rows.length - voidedCount)} />
          <StatCard label="Wholesale sales" value={String(wholesaleCount)} accent="success.main" />
          {voidedCount > 0 && (
            <StatCard label="Voided" value={String(voidedCount)} accent="error.main" />
          )}
        </Box>
      )}

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load report.</Alert>}

      {!enabled && !isLoading && (
        <Box py={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Set your filters and click <strong>Run report</strong> to load data.
          </Typography>
        </Box>
      )}

      {enabled && (
        <AppDataGrid
          rows={gridRows}
          columns={columns}
          getRowId={(r) => (r.__detail ? `${r.sale_number}::items` : r.sale_number)}
          getRowHeight={(params) => (params.model.__detail ? "auto" : null)}
          loading={isLoading}
          density="compact"
          pageSizeOptions={[50, 100, 200]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        />
      )}
    </DashboardTemplate>
  );
}
