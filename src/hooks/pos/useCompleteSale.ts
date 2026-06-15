import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { notify } from "@/store/notificationStore";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import type { CartLine } from "@/store/cartStore";
import type { CompleteSaleResult, PaymentMethod } from "@/types/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference_number?: string | null;
}

export interface CompleteSalePayload {
  customerId: string | null;
  saleType: "walk_in" | "delivery" | "account";
  payments: PaymentEntry[];
}

// The server re-prices every line (retail vs wholesale at the 6+ threshold),
// so we only send product + quantity. Quantity is counted in packs.
function buildItems(lines: CartLine[]) {
  return lines.map((l) => ({ product_id: l.productId, quantity: l.quantity }));
}

export function useCompleteSale() {
  const clearCart = useCartStore((s) => s.clearCart);
  const lines = useCartStore((s) => s.lines);
  const branchId = useAuthStore((s) => s.profile?.branch_id);

  return useMutation<CompleteSaleResult, Error, CompleteSalePayload>({
    mutationFn: async ({ customerId, saleType, payments }) => {
      const payload = {
        branch_id: branchId,
        customer_id: customerId,
        sale_type: saleType,
        items: buildItems(lines),
        payments: payments.map((p) => ({
          payment_method: p.method,
          amount: p.amount,
          reference_number: p.reference_number ?? null,
        })),
      };

      const { data, error } = await db.rpc("complete_sale", { p_data: payload });
      if (error) throw error;
      return data as CompleteSaleResult;
    },
    onSuccess: () => clearCart(),
    onError: (e) => notify.error(e.message),
  });
}
