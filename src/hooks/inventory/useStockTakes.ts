import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockTakeService } from "@/services/stockTakeService";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/store/notificationStore";
import { PRODUCT_STOCK_KEY, ADJUSTMENTS_KEY, INV_STATS_KEY } from "./useInventory";

export const STOCK_TAKES_KEY = "stock-takes";

export function useStockTakes() {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null);
  return useQuery({
    queryKey: [STOCK_TAKES_KEY, branchId],
    queryFn: () => stockTakeService.getAll(branchId),
    staleTime: 1000 * 60,
  });
}

export function useStockTake(id: string | undefined) {
  return useQuery({
    queryKey: [STOCK_TAKES_KEY, id],
    queryFn: () => stockTakeService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 15,
  });
}

export function useCreateStockTake() {
  const qc = useQueryClient();
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null);
  return useMutation({
    mutationFn: (notes?: string) => stockTakeService.create(branchId!, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] });
      notify.success("Stock take created");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useAddStockTakeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { stock_take_id: string; product_id: string; branch_id: string }) =>
      stockTakeService.addItem(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] });
      notify.success("Product added");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useUpdateStockTakeItemCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, countedQuantity, notes }: { itemId: string; countedQuantity: number; notes?: string }) =>
      stockTakeService.updateItemCount(itemId, countedQuantity, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] }),
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useRemoveStockTakeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => stockTakeService.removeItem(itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] });
      notify.success("Item removed");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useCompleteStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stockTakeService.complete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] });
      qc.invalidateQueries({ queryKey: [PRODUCT_STOCK_KEY] });
      qc.invalidateQueries({ queryKey: [ADJUSTMENTS_KEY] });
      qc.invalidateQueries({ queryKey: [INV_STATS_KEY] });
      notify.success("Stock take completed — adjustments applied");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useDeleteStockTake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stockTakeService.deleteDraft(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STOCK_TAKES_KEY] });
      notify.success("Draft stock take deleted");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}
