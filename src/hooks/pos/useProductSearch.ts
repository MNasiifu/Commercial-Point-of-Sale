import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { ProductSearchResult } from "@/types/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Fuzzy + barcode search for POS — backed by search_products RPC
export function useProductSearch(query: string) {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null);

  return useQuery<ProductSearchResult[]>({
    queryKey: ["pos-search", query, branchId],
    enabled: query.trim().length >= 2,
    staleTime: 0, // Always fetch fresh for search
    gcTime: 1000 * 60, // Cache for 1 minute
    refetchOnMount: true, // Refetch when re-enabled after clearing
    refetchOnWindowFocus: false, // Don't refetch on window focus for search
    queryFn: async () => {
      const { data, error } = await db.rpc("search_products", {
        p_query: query.trim(),
        p_branch_id: branchId,
      });
      if (error) throw error;
      return (data ?? []) as ProductSearchResult[];
    },
  });
}

// Exact barcode lookup — used when scanner fires a full barcode
export function useProductByBarcode(barcode: string | null) {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null);

  return useQuery<ProductSearchResult | null>({
    queryKey: ["pos-barcode", barcode, branchId],
    enabled: !!barcode,
    staleTime: 0, // Always fetch fresh
    gcTime: 1000 * 60, // Cache for 1 minute
    refetchOnMount: true, // Refetch when barcode changes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    queryFn: async () => {
      const { data, error } = await db.rpc("get_product_by_barcode", {
        p_barcode: barcode!,
        p_branch_id: branchId,
      });
      if (error) throw error;
      return (data as ProductSearchResult | null) ?? null;
    },
  });
}
