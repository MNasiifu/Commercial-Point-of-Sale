import { useState } from "react";
import {
  Box, Grid, Typography, Paper, Chip, Skeleton, Alert, Stack, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
} from "@mui/material";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SellIcon from "@mui/icons-material/Sell";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";

import { useNavigate } from "react-router-dom";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate/DashboardTemplate";
import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { useDashboardKPIs, useTellerSummary } from "@/hooks/dashboard/useDashboard";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { useAuth } from "@/hooks/auth/useAuth";
import { formatUGX, formatDate, formatPaymentMethod } from "@/lib/formatters";
import type { PaymentMethod } from "@/types/database.types";

const PAYMENT_COLORS: Record<string, string> = {
  cash: "#4caf50",
  mtn_momo: "#ffb300",
  airtel_money: "#f44336",
};

export function DashboardPage() {
  const { hasFullDashboard, hasTellerDashboard } = usePermissions();
  const { fullName, branchDetails } = useAuth();
  const today = formatDate(new Date().toISOString());

  return (
    <DashboardTemplate>
      <Box mb={3}>
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="h5" fontWeight={700}>Welcome back, {fullName}</Typography>
          {branchDetails && (
            <Chip
              icon={<StorefrontIcon />}
              label={branchDetails.name}
              color="primary"
              size="small"
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: "6px" }}
            />
          )}
        </Box>
        <Typography variant="body2" color="text.secondary">
          {today} ·{" "}
          {hasTellerDashboard && !hasFullDashboard
            ? "Your sales summary for today."
            : "Here's what's happening across the shops today."}
        </Typography>
      </Box>

      {hasFullDashboard ? <ManagerDashboard /> : <TellerDashboardToday />}
    </DashboardTemplate>
  );
}

// ─── Admin / Manager dashboard ───────────────────────────────────────────────

function ManagerDashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );
  const { data: kpis, isLoading, isError } = useDashboardKPIs(branchId);

  if (isError) {
    return <Alert severity="error">Failed to load dashboard data.</Alert>;
  }

  return (
    <>
      {role === "admin" && (
        <Box mb={2.5} display="flex" justifyContent="flex-end">
          <BranchSelect value={branchId} onChange={setBranchId} />
        </Box>
      )}

      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Today's Revenue" value={isLoading ? "—" : formatUGX(kpis!.today_revenue)}
            icon={<AttachMoneyIcon />} iconBg="success.50" iconColor="success.main" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Transactions" value={isLoading ? "—" : kpis!.today_transactions} subtitle="sales today"
            icon={<ReceiptLongIcon />} iconBg="primary.50" iconColor="primary.main" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Wholesale Sales" value={isLoading ? "—" : kpis!.today_wholesale_sales} subtitle="6+ packs today"
            icon={<SellIcon />} iconBg="info.50" iconColor="info.main" loading={isLoading} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Low Stock Items" value={isLoading ? "—" : kpis!.low_stock_count} subtitle="1–5 units remaining"
            icon={<WarningAmberIcon />} iconBg="warning.50" iconColor="warning.main" loading={isLoading}
            onClick={() => navigate("/inventory/product-stock")} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Out of Stock" value={isLoading ? "—" : kpis!.out_of_stock_count} subtitle="zero units"
            icon={<ErrorOutlineIcon />} iconBg="error.50" iconColor="error.main" loading={isLoading}
            onClick={() => navigate("/inventory/product-stock")} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard title="Pending Transfers" value={isLoading ? "—" : kpis!.pending_transfers} subtitle="awaiting receipt"
            icon={<SwapHorizIcon />} iconBg="warning.50" iconColor="warning.dark" loading={isLoading}
            onClick={() => navigate("/inventory/transfers")} />
        </Grid>
      </Grid>

      {/* Per-branch sales (admin viewing all branches) */}
      {role === "admin" && branchId === null && (kpis?.branch_sales_today?.length ?? 0) > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2.5, pt: 2, pb: 1 }}>
            Sales by shop — today
          </Typography>
          <Divider />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Shop</TableCell>
                <TableCell align="right">Transactions</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kpis!.branch_sales_today!.map((b) => (
                <TableRow key={b.code} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{b.name}</Typography></TableCell>
                  <TableCell align="right">{b.transactions}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{formatUGX(b.revenue)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <TopProductsChart products={kpis?.top_products_today ?? null} loading={isLoading} />
        </Grid>
        <Grid item xs={12} md={5}>
          <PaymentBreakdownChart breakdown={kpis?.payment_breakdown_today ?? null} loading={isLoading} />
        </Grid>
      </Grid>
    </>
  );
}

// ─── Teller dashboard ────────────────────────────────────────────────────────

function TellerDashboardToday() {
  const { data: summary, isLoading, isError } = useTellerSummary();

  if (isError) {
    return <Alert severity="error">Failed to load your summary.</Alert>;
  }

  return (
    <>
      <Grid container spacing={2.5} mb={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Transactions" value={isLoading ? "—" : summary!.transaction_count} subtitle="today"
            icon={<ReceiptLongIcon />} iconBg="primary.50" iconColor="primary.main" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="My Total Sales" value={isLoading ? "—" : formatUGX(summary!.total_sales)}
            icon={<AttachMoneyIcon />} iconBg="success.50" iconColor="success.main" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Wholesale Sales" value={isLoading ? "—" : summary!.wholesale_count} subtitle="6+ packs"
            icon={<SellIcon />} iconBg="info.50" iconColor="info.main" loading={isLoading} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Voided Sales" value={isLoading ? "—" : summary!.voided_count} subtitle="today"
            icon={<WarningAmberIcon />} iconBg="warning.50" iconColor="warning.main" loading={isLoading} />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>Payment methods — today</Typography>
        {isLoading ? (
          <Stack spacing={1}>{[1, 2, 3].map((i) => <Skeleton key={i} height={28} />)}</Stack>
        ) : (
          <Stack spacing={1.5}>
            {(["cash", "mtn_momo", "airtel_money"] as PaymentMethod[]).map((method) => {
              const amount =
                method === "cash" ? summary!.cash_total
                  : method === "mtn_momo" ? summary!.mtn_momo_total
                  : summary!.airtel_money_total;
              return (
                <Box key={method} display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: PAYMENT_COLORS[method], flexShrink: 0 }} />
                    <Typography variant="body2">{formatPaymentMethod(method)}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} fontFamily="monospace">{formatUGX(amount)}</Typography>
                </Box>
              );
            })}
            <Divider />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">{formatUGX(summary!.total_sales)}</Typography>
            </Box>
          </Stack>
        )}
      </Paper>
    </>
  );
}

// ─── Charts ──────────────────────────────────────────────────────────────────

interface TopProductsChartProps {
  products: Array<{ name: string; qty: number; revenue: number }> | null;
  loading: boolean;
}

function TopProductsChart({ products, loading }: TopProductsChartProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
      <Typography variant="subtitle2" fontWeight={700} mb={2}>Top products today</Typography>
      {loading && <Skeleton variant="rectangular" height={200} />}
      {!loading && (!products || products.length === 0) && (
        <Box py={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">No sales recorded today yet.</Typography>
        </Box>
      )}
      {!loading && products && products.length > 0 && (
        <BarChart
          dataset={products.map((p) => ({
            name: p.name.length > 18 ? p.name.slice(0, 18) + "…" : p.name,
            revenue: p.revenue,
            qty: p.qty,
          }))}
          series={[{ dataKey: "revenue", label: "Revenue (UGX)", color: "#1976d2" }]}
          xAxis={[{ scaleType: "band", dataKey: "name" }]}
          yAxis={[{ valueFormatter: (v: number) => `${(v / 1000).toFixed(0)}K` }]}
          height={230}
          margin={{ left: 60, bottom: 60, right: 10, top: 10 }}
          slotProps={{ legend: { hidden: true } }}
          tooltip={{ trigger: "item" }}
        />
      )}
    </Paper>
  );
}

interface PaymentBreakdownChartProps {
  breakdown: Record<string, number> | null;
  loading: boolean;
}

function PaymentBreakdownChart({ breakdown, loading }: PaymentBreakdownChartProps) {
  const entries = Object.entries(breakdown ?? {});
  const pieData = entries.map(([method, total], i) => ({
    id: i,
    value: total,
    label: formatPaymentMethod(method as PaymentMethod),
    color: PAYMENT_COLORS[method] ?? "#9e9e9e",
  }));
  const grandTotal = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
      <Typography variant="subtitle2" fontWeight={700} mb={2}>Payment breakdown today</Typography>
      {loading && <Skeleton variant="circular" width={180} height={180} sx={{ mx: "auto" }} />}
      {!loading && entries.length === 0 && (
        <Box py={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">No payments today yet.</Typography>
        </Box>
      )}
      {!loading && entries.length > 0 && (
        <>
          <Box display="flex" justifyContent="center">
            <PieChart
              series={[{ data: pieData, innerRadius: 40, outerRadius: 90, paddingAngle: 3, cornerRadius: 4 }]}
              height={200}
              slotProps={{ legend: { hidden: true } }}
              tooltip={{ trigger: "item" }}
            />
          </Box>
          <Stack spacing={1} mt={1.5}>
            {pieData.map((d) => (
              <Box key={d.id} display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip size="small" sx={{ width: 12, height: 12, borderRadius: "2px", bgcolor: d.color,
                    border: "none", p: 0, "& .MuiChip-label": { display: "none" } }} />
                  <Typography variant="caption">{d.label}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" fontFamily="monospace" fontWeight={600}>{formatUGX(d.value)}</Typography>
                  {grandTotal > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {((d.value / grandTotal) * 100).toFixed(0)}%
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
