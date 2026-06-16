import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Grid, Typography, Stack } from "@mui/material";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RemoveShoppingCartIcon from "@mui/icons-material/RemoveShoppingCart";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import TuneIcon from "@mui/icons-material/Tune";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CategoryIcon from "@mui/icons-material/Category";

import { StatCard } from "@/components/molecules/StatCard/StatCard";
import { BranchSelect } from "@/components/molecules/BranchSelect/BranchSelect";
import { useInventoryStats } from "@/hooks/inventory/useInventory";
import { useAuth } from "@/hooks/auth/useAuth";
import { usePermissions } from "@/hooks/auth/usePermissions";
import { formatUGX } from "@/lib/formatters";

export function InventoryOverview() {
  const navigate = useNavigate();
  const { role } = useAuth();
  // Tellers get a read-only view: no Stock Value / transfer / adjustment
  // cards (which expose finances or link to pages they cannot open) and no
  // Quick Actions. canManageInventory is admin/manager only.
  const { canManageInventory } = usePermissions();
  const [branchId, setBranchId] = useState<string | null | undefined>(
    role === "admin" ? null : undefined,
  );
  const { data: stats, isLoading } = useInventoryStats(branchId);

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Box flex={1}>
          <Typography variant="h5" fontWeight={700}>Inventory</Typography>
          <Typography variant="body2" color="text.secondary">
            {canManageInventory
              ? "Stock on hand, transfers, and adjustments."
              : "Stock on hand at your branch."}
          </Typography>
        </Box>
        <BranchSelect value={branchId} onChange={setBranchId} />
      </Box>

      <Grid container spacing={2} mb={4}>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Active Products" value={stats?.totalProducts ?? 0}
            icon={<CategoryIcon />} iconColor="primary.main" iconBg="primary.50"
            loading={isLoading} onClick={() => navigate("/products")} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Units in Stock" value={stats?.totalStockUnits ?? 0}
            icon={<Inventory2Icon />} iconColor="info.main" iconBg="info.50"
            loading={isLoading} onClick={() => navigate("/inventory/product-stock")} />
        </Grid>
        {canManageInventory && (
          <Grid item xs={6} sm={4} md={3}>
            <StatCard title="Stock Value" value={formatUGX(stats?.totalStockValue ?? 0)}
              icon={<AccountBalanceIcon />} iconColor="success.main" iconBg="success.50"
              loading={isLoading} />
          </Grid>
        )}
        {canManageInventory && (
          <Grid item xs={6} sm={4} md={3}>
            <StatCard title="Pending Transfers" value={stats?.pendingTransfers ?? 0}
              subtitle="awaiting receipt" icon={<SwapHorizIcon />} iconColor="warning.main"
              iconBg="warning.50" loading={isLoading} onClick={() => navigate("/inventory/transfers")} />
          </Grid>
        )}
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Low Stock" value={stats?.lowStockCount ?? 0}
            subtitle="≤ 5 units" icon={<WarningAmberIcon />} iconColor="warning.main"
            iconBg="warning.50" loading={isLoading} onClick={() => navigate("/inventory/product-stock")} />
        </Grid>
        <Grid item xs={6} sm={4} md={3}>
          <StatCard title="Out of Stock" value={stats?.outOfStockCount ?? 0}
            icon={<RemoveShoppingCartIcon />} iconColor="error.main" iconBg="error.50"
            loading={isLoading} onClick={() => navigate("/inventory/product-stock")} />
        </Grid>
        {canManageInventory && (
          <Grid item xs={6} sm={4} md={3}>
            <StatCard title="Recent Adjustments" value={stats?.recentAdjustmentCount ?? 0}
              subtitle="last 7 days" icon={<TuneIcon />} iconColor="secondary.main"
              iconBg="secondary.50" loading={isLoading} onClick={() => navigate("/inventory/adjustments")} />
          </Grid>
        )}
      </Grid>

      {canManageInventory && (
        <>
          <Typography variant="subtitle1" fontWeight={600} mb={1.5}>Quick Actions</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} flexWrap="wrap">
            <Button variant="contained" startIcon={<LocalShippingIcon />} onClick={() => navigate("/inventory/receive")}>
              Receive Stock
            </Button>
            <Button variant="contained" color="secondary" startIcon={<SwapHorizIcon />} onClick={() => navigate("/inventory/transfers")}>
              Transfers
            </Button>
            <Button variant="outlined" startIcon={<TuneIcon />} onClick={() => navigate("/inventory/adjustments")}>
              Adjustments
            </Button>
            <Button variant="outlined" startIcon={<FactCheckIcon />} onClick={() => navigate("/inventory/stock-takes")}>
              Stock Takes
            </Button>
            <Button variant="outlined" startIcon={<Inventory2Icon />} onClick={() => navigate("/inventory/product-stock")}>
              Product Stock
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}
