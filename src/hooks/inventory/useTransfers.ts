import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { transferService, type TransferFilters } from "@/services/transferService";
import { useAuthStore } from "@/store/authStore";
import { notify } from "@/store/notificationStore";
import { PRODUCT_STOCK_KEY, INV_STATS_KEY } from "./useInventory";

export const TRANSFERS_KEY = "stock-transfers";

function useScopedBranch(branchId: string | null | undefined) {
  const own = useAuthStore((s) => s.profile?.branch_id ?? null);
  return branchId === undefined ? own : branchId;
}

export function useTransfers(filters: TransferFilters = {}, branchId?: string | null) {
  const scoped = useScopedBranch(branchId);
  return useQuery({
    queryKey: [TRANSFERS_KEY, scoped, filters],
    queryFn: () => transferService.getAll(scoped, filters),
    staleTime: 1000 * 30,
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: [TRANSFERS_KEY, id],
    queryFn: () => transferService.getById(id!),
    enabled: !!id,
    staleTime: 1000 * 15,
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [TRANSFERS_KEY] });
  qc.invalidateQueries({ queryKey: [PRODUCT_STOCK_KEY] });
  qc.invalidateQueries({ queryKey: [INV_STATS_KEY] });
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      from_branch_id: string;
      to_branch_id: string;
      notes?: string | null;
      items: { product_id: string; quantity: number }[];
    }) => transferService.create(payload),
    onSuccess: (r) => {
      invalidate(qc);
      notify.success(`Transfer ${r.transfer_number} sent`);
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useConfirmTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      transfer_id: string;
      notes?: string | null;
      items?: { item_id: string; quantity_received: number }[];
    }) => transferService.confirm(payload),
    onSuccess: (r) => {
      invalidate(qc);
      notify.success(
        r.shortfall > 0
          ? `Transfer received with a shortfall of ${r.shortfall} unit(s)`
          : "Transfer received in full",
      );
    },
    onError: (e: Error) => notify.error(e.message),
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transferId: string) => transferService.cancel(transferId),
    onSuccess: () => {
      invalidate(qc);
      notify.success("Transfer cancelled — stock returned to source");
    },
    onError: (e: Error) => notify.error(e.message),
  });
}
