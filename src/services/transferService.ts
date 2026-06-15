import { supabase } from "@/lib/supabase";
import type { StockTransfer, StockTransferStatus } from "@/types/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface TransferRow extends StockTransfer {
  from_branch: { name: string; code: string } | null;
  to_branch: { name: string; code: string } | null;
  items_count: number;
}

export interface TransferItemDetail {
  id: string;
  product_id: string;
  product_name: string;
  size_name: string | null;
  color_name: string | null;
  quantity_sent: number;
  quantity_received: number | null;
}

export interface TransferDetail extends StockTransfer {
  from_branch: { name: string; code: string } | null;
  to_branch: { name: string; code: string } | null;
  items: TransferItemDetail[];
}

export interface TransferFilters {
  status?: StockTransferStatus;
  direction?: "incoming" | "outgoing";
}

const LIST_SELECT = `
  *,
  from_branch:branches!from_branch_id(name, code),
  to_branch:branches!to_branch_id(name, code),
  stock_transfer_items(id)
` as const;

const DETAIL_SELECT = `
  *,
  from_branch:branches!from_branch_id(name, code),
  to_branch:branches!to_branch_id(name, code),
  stock_transfer_items(
    id, product_id, quantity_sent, quantity_received,
    products(name, sizes(name), colors(name))
  )
` as const;

export const transferService = {
  async getAll(branchId: string | null, filters: TransferFilters = {}): Promise<TransferRow[]> {
    let query = db.from("stock_transfers").select(LIST_SELECT).order("created_at", { ascending: false });

    if (branchId) {
      if (filters.direction === "incoming") query = query.eq("to_branch_id", branchId);
      else if (filters.direction === "outgoing") query = query.eq("from_branch_id", branchId);
      else query = query.or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`);
    }
    if (filters.status) query = query.eq("status", filters.status);

    const { data, error } = await query;
    if (error) throw error;

    type Raw = StockTransfer & {
      from_branch: { name: string; code: string } | null;
      to_branch: { name: string; code: string } | null;
      stock_transfer_items: { id: string }[] | null;
    };
    return (data as Raw[]).map((t) => ({
      ...t,
      items_count: t.stock_transfer_items?.length ?? 0,
    }));
  },

  async getById(id: string): Promise<TransferDetail> {
    const { data, error } = await db.from("stock_transfers").select(DETAIL_SELECT).eq("id", id).single();
    if (error) throw error;

    type RawItem = {
      id: string; product_id: string; quantity_sent: number; quantity_received: number | null;
      products: { name: string; sizes: { name: string } | null; colors: { name: string } | null } | null;
    };
    const raw = data as StockTransfer & {
      from_branch: { name: string; code: string } | null;
      to_branch: { name: string; code: string } | null;
      stock_transfer_items: RawItem[] | null;
    };

    return {
      ...raw,
      items: (raw.stock_transfer_items ?? []).map((it) => ({
        id: it.id,
        product_id: it.product_id,
        product_name: it.products?.name ?? "—",
        size_name: it.products?.sizes?.name ?? null,
        color_name: it.products?.colors?.name ?? null,
        quantity_sent: it.quantity_sent,
        quantity_received: it.quantity_received,
      })),
    };
  },

  async create(payload: {
    from_branch_id: string;
    to_branch_id: string;
    notes?: string | null;
    items: { product_id: string; quantity: number }[];
  }): Promise<{ transfer_id: string; transfer_number: string }> {
    const { data, error } = await db.rpc("create_stock_transfer", { p_data: payload });
    if (error) throw error;
    return data as { transfer_id: string; transfer_number: string };
  },

  async confirm(payload: {
    transfer_id: string;
    notes?: string | null;
    items?: { item_id: string; quantity_received: number }[];
  }): Promise<{ transfer_id: string; status: string; shortfall: number }> {
    const { data, error } = await db.rpc("confirm_stock_transfer", { p_data: payload });
    if (error) throw error;
    return data as { transfer_id: string; status: string; shortfall: number };
  },

  async cancel(transferId: string): Promise<{ transfer_id: string; status: string }> {
    const { data, error } = await db.rpc("cancel_stock_transfer", { p_transfer_id: transferId });
    if (error) throw error;
    return data as { transfer_id: string; status: string };
  },
};
