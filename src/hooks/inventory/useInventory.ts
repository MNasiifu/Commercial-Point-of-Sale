import { useQuery } from "@tanstack/react-query";
import {
  inventoryService,
  type ProductStockFilters,
  type AdjustmentFilters,
} from "@/services/inventoryService";
import { useAuthStore } from "@/store/authStore";

export const PRODUCT_STOCK_KEY = "product-stock";
export const ADJUSTMENTS_KEY = "stock-adjustments";
export const INV_STATS_KEY = "inventory-stats";
export const BRANCHES_KEY = "branches-list";

/**
 * Resolve which branch a query should target.
 *   undefined → the signed-in user's own branch
 *   null      → all branches (admin "everything" view)
 *   string    → a specific branch
 */
function useScopedBranch(branchId: string | null | undefined) {
  const own = useAuthStore((s) => s.profile?.branch_id ?? null);
  return branchId === undefined ? own : branchId;
}

export function useBranchesList() {
  return useQuery({
    queryKey: [BRANCHES_KEY],
    queryFn: inventoryService.getBranches,
    staleTime: 1000 * 60 * 10,
  });
}

export function useProductStock(
  filters: ProductStockFilters = {},
  branchId?: string | null,
  options: { enabled?: boolean } = {},
) {
  const scoped = useScopedBranch(branchId);
  return useQuery({
    queryKey: [PRODUCT_STOCK_KEY, scoped, filters],
    queryFn: () => inventoryService.getProductStock(scoped, filters),
    staleTime: 1000 * 60 * 2,
    enabled: options.enabled ?? true,
  });
}

export function useStockAdjustments(
  filters: AdjustmentFilters = {},
  branchId?: string | null,
) {
  const scoped = useScopedBranch(branchId);
  return useQuery({
    queryKey: [ADJUSTMENTS_KEY, scoped, filters],
    queryFn: () => inventoryService.getAdjustments(scoped, filters),
    staleTime: 1000 * 60,
  });
}

export function useInventoryStats(branchId?: string | null) {
  const scoped = useScopedBranch(branchId);
  return useQuery({
    queryKey: [INV_STATS_KEY, scoped],
    queryFn: () => inventoryService.getStats(scoped),
    staleTime: 1000 * 60 * 2,
  });
}
