import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventoryService";
import { notify } from "@/store/notificationStore";
import { PRODUCT_STOCK_KEY, ADJUSTMENTS_KEY, INV_STATS_KEY } from "./useInventory";
import type { AdjustmentType } from "@/types/database.types";

function invalidateInventory(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [PRODUCT_STOCK_KEY] });
  qc.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
  qc.invalidateQueries({ queryKey: [INV_STATS_KEY] });
}

export function useApplyStockAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      branch_id: string;
      product_id: string;
      adjustment_type: AdjustmentType;
      quantity: number;
      reason: string;
    }) => inventoryService.applyAdjustment(payload),
    onSuccess: () => {
      invalidateInventory(qc);
      notify.success("Stock adjustment applied");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      branch_id: string;
      reference?: string | null;
      notes?: string | null;
      received_date?: string | null;
      items: { product_id: string; quantity: number; cost_price_per_unit: number }[];
    }) => inventoryService.receiveStock(payload),
    onSuccess: (r) => {
      invalidateInventory(qc);
      notify.success(`Stock received — ${r.items} item(s) added to the main store`);
    },
    onError: (e: Error) => notify.error(e.message),
  });
}
