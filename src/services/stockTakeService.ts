import { supabase } from "@/lib/supabase";
import type { StockTake, StockTakeItem, Product, Profile } from "@/types/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface StockTakeWithDetails extends StockTake {
  started_by_profile: Pick<Profile, "id" | "full_name"> | null;
  completed_by_profile: Pick<Profile, "id" | "full_name"> | null;
  item_count: number;
}

export interface StockTakeItemWithDetails extends StockTakeItem {
  products:
    | (Pick<Product, "id" | "name"> & {
        sizes: { name: string } | null;
        colors: { name: string } | null;
      })
    | null;
}

export interface StockTakeFull extends StockTake {
  started_by_profile: Pick<Profile, "id" | "full_name"> | null;
  completed_by_profile: Pick<Profile, "id" | "full_name"> | null;
  stock_take_items: StockTakeItemWithDetails[];
}

const LIST_SELECT = `
  *,
  started_by_profile:profiles!started_by(id, full_name),
  completed_by_profile:profiles!completed_by(id, full_name),
  stock_take_items(id)
` as const;

const DETAIL_SELECT = `
  *,
  started_by_profile:profiles!started_by(id, full_name),
  completed_by_profile:profiles!completed_by(id, full_name),
  stock_take_items(
    *,
    products(id, name, sizes(name), colors(name))
  )
` as const;

export const stockTakeService = {
  async getAll(branchId: string | null): Promise<StockTakeWithDetails[]> {
    let query = db
      .from("stock_takes")
      .select(LIST_SELECT)
      .order("created_at", { ascending: false })
      .limit(100);
    if (branchId) query = query.eq("branch_id", branchId);

    const { data, error } = await query;
    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((st) => ({
      ...st,
      item_count: st.stock_take_items?.length ?? 0,
      stock_take_items: undefined,
    })) as StockTakeWithDetails[];
  },

  async getById(id: string): Promise<StockTakeFull> {
    const { data, error } = await db.from("stock_takes").select(DETAIL_SELECT).eq("id", id).single();
    if (error) throw error;
    return data as unknown as StockTakeFull;
  },

  async create(branchId: string, notes?: string): Promise<StockTake> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    const { data, error } = await db
      .from("stock_takes")
      .insert({ branch_id: branchId, status: "draft", notes: notes || null, started_by: userId })
      .select("*")
      .single();
    if (error) throw error;
    return data as StockTake;
  },

  /** Add a product line, snapshotting its current on-hand at the take's branch. */
  async addItem(payload: {
    stock_take_id: string;
    product_id: string;
    branch_id: string;
  }): Promise<StockTakeItem> {
    const { data: level } = await db
      .from("stock_levels")
      .select("quantity")
      .eq("product_id", payload.product_id)
      .eq("branch_id", payload.branch_id)
      .maybeSingle();
    const systemQty = Number(level?.quantity ?? 0);

    const { data, error } = await db
      .from("stock_take_items")
      .insert({
        stock_take_id: payload.stock_take_id,
        product_id: payload.product_id,
        system_quantity: systemQty,
      })
      .select("*")
      .single();
    if (error) throw error;
    return data as StockTakeItem;
  },

  async updateItemCount(itemId: string, countedQuantity: number, notes?: string): Promise<void> {
    const { error } = await db
      .from("stock_take_items")
      .update({ counted_quantity: countedQuantity, notes: notes || null })
      .eq("id", itemId);
    if (error) throw error;
  },

  async removeItem(itemId: string): Promise<void> {
    const { error } = await db.from("stock_take_items").delete().eq("id", itemId);
    if (error) throw error;
  },

  async complete(id: string): Promise<{ stock_take_id: string; adjustments: number }> {
    const { data, error } = await db.rpc("complete_stock_take", { p_stock_take_id: id });
    if (error) throw error;
    return data as { stock_take_id: string; adjustments: number };
  },

  async deleteDraft(id: string): Promise<void> {
    const { error } = await db.from("stock_takes").delete().eq("id", id).eq("status", "draft");
    if (error) throw error;
  },
};
