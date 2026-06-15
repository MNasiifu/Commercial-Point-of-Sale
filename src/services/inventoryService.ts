import { supabase } from "@/lib/supabase";
import type { AdjustmentType } from "@/types/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const LOW_STOCK_THRESHOLD = 5;

// ─── Row / filter types ─────────────────────────────────────
export interface BranchLite {
  id: string;
  name: string;
  code: string;
  is_main_store: boolean;
}

export interface ProductStockRow {
  product_id: string;
  product_name: string;
  brand_name: string | null;
  size_name: string | null;
  color_name: string | null;
  category_name: string | null;
  pack_size: number;
  cost_price: number;
  retail_price: number;
  quantity: number;
  is_active: boolean;
}

export interface ProductStockFilters {
  search?: string;
  categoryId?: string;
  showOutOfStock?: boolean;
  lowStockOnly?: boolean;
}

export interface AdjustmentRow {
  id: string;
  branch_id: string;
  branch_name: string | null;
  product_id: string;
  product_name: string | null;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string | null;
  adjusted_by_name: string | null;
  created_at: string;
}

export interface AdjustmentFilters {
  search?: string;
  adjustmentType?: AdjustmentType;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingTransfers: number;
  recentAdjustmentCount: number;
}

interface StockLevelRow {
  product_id: string;
  branch_id: string;
  quantity: number;
}

export const inventoryService = {
  // ─── Branches (for admin branch pickers) ───────────────────
  async getBranches(): Promise<BranchLite[]> {
    const { data, error } = await db
      .from("branches")
      .select("id, name, code, is_main_store")
      .eq("is_active", true)
      .order("is_main_store", { ascending: false })
      .order("name");
    if (error) throw error;
    return data as BranchLite[];
  },

  async getMainStore(): Promise<BranchLite | null> {
    const { data, error } = await db
      .from("branches")
      .select("id, name, code, is_main_store")
      .eq("is_main_store", true)
      .maybeSingle();
    if (error) throw error;
    return (data as BranchLite) ?? null;
  },

  // ─── Product stock (on-hand per product, scoped to a branch) ─
  async getProductStock(
    branchId: string | null,
    filters: ProductStockFilters = {},
  ): Promise<ProductStockRow[]> {
    let productsQuery = db
      .from("products")
      .select(
        `id, name, pack_size, cost_price, retail_price, is_active, category_id,
         brands(name), sizes(name), colors(name), categories(name)`,
      )
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("name");
    if (filters.categoryId) productsQuery = productsQuery.eq("category_id", filters.categoryId);

    let levelsQuery = db.from("stock_levels").select("product_id, branch_id, quantity");
    if (branchId) levelsQuery = levelsQuery.eq("branch_id", branchId);

    const [{ data: products, error: pErr }, { data: levels, error: lErr }] = await Promise.all([
      productsQuery,
      levelsQuery,
    ]);
    if (pErr) throw pErr;
    if (lErr) throw lErr;

    const qtyByProduct = new Map<string, number>();
    for (const l of levels as StockLevelRow[]) {
      qtyByProduct.set(l.product_id, (qtyByProduct.get(l.product_id) ?? 0) + Number(l.quantity));
    }

    type Row = {
      id: string; name: string; pack_size: number; cost_price: number; retail_price: number;
      is_active: boolean; category_id: string | null;
      brands: { name: string } | null; sizes: { name: string } | null;
      colors: { name: string } | null; categories: { name: string } | null;
    };

    let result: ProductStockRow[] = (products as Row[]).map((p) => ({
      product_id: p.id,
      product_name: p.name,
      brand_name: p.brands?.name ?? null,
      size_name: p.sizes?.name ?? null,
      color_name: p.colors?.name ?? null,
      category_name: p.categories?.name ?? null,
      pack_size: p.pack_size,
      cost_price: p.cost_price,
      retail_price: p.retail_price,
      quantity: qtyByProduct.get(p.id) ?? 0,
      is_active: p.is_active,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) => r.product_name.toLowerCase().includes(q));
    }
    if (filters.showOutOfStock === false) result = result.filter((r) => r.quantity > 0);
    if (filters.lowStockOnly) result = result.filter((r) => r.quantity > 0 && r.quantity <= LOW_STOCK_THRESHOLD);

    return result;
  },

  // ─── Adjustments ───────────────────────────────────────────
  async getAdjustments(
    branchId: string | null,
    filters: AdjustmentFilters = {},
  ): Promise<AdjustmentRow[]> {
    let query = db
      .from("stock_adjustments")
      .select(
        `*, products(name), branches(name),
         adjusted_by_profile:profiles!adjusted_by(full_name)`,
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (branchId) query = query.eq("branch_id", branchId);
    if (filters.adjustmentType) query = query.eq("adjustment_type", filters.adjustmentType);
    if (filters.dateFrom) query = query.gte("created_at", filters.dateFrom);
    if (filters.dateTo) query = query.lte("created_at", filters.dateTo + "T23:59:59");

    const { data, error } = await query;
    if (error) throw error;

    type Raw = {
      id: string; branch_id: string; product_id: string; adjustment_type: AdjustmentType;
      quantity: number; reason: string | null; created_at: string;
      products: { name: string } | null; branches: { name: string } | null;
      adjusted_by_profile: { full_name: string } | null;
    };

    let result: AdjustmentRow[] = (data as Raw[]).map((a) => ({
      id: a.id,
      branch_id: a.branch_id,
      branch_name: a.branches?.name ?? null,
      product_id: a.product_id,
      product_name: a.products?.name ?? null,
      adjustment_type: a.adjustment_type,
      quantity: a.quantity,
      reason: a.reason,
      adjusted_by_name: a.adjusted_by_profile?.full_name ?? null,
      created_at: a.created_at,
    }));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.product_name ?? "").toLowerCase().includes(q) ||
          (a.reason ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  },

  async applyAdjustment(payload: {
    branch_id: string;
    product_id: string;
    adjustment_type: AdjustmentType;
    quantity: number;
    reason: string;
  }): Promise<{ adjustment_id: string }> {
    const { data, error } = await db.rpc("apply_stock_adjustment", { p_data: payload });
    if (error) throw error;
    return data as { adjustment_id: string };
  },

  // ─── Receive stock (main store only) ───────────────────────
  async receiveStock(payload: {
    branch_id: string;
    reference?: string | null;
    notes?: string | null;
    received_date?: string | null; // ISO date (yyyy-mm-dd) the delivery arrived
    items: { product_id: string; quantity: number; cost_price_per_unit: number }[];
  }): Promise<{ receiving_id: string; items: number }> {
    const { data, error } = await db.rpc("receive_stock", { p_data: payload });
    if (error) throw error;
    return data as { receiving_id: string; items: number };
  },

  // ─── Inventory stats ───────────────────────────────────────
  async getStats(branchId: string | null): Promise<InventoryStats> {
    let levelsQuery = db
      .from("stock_levels")
      .select("quantity, product_id, products(cost_price)");
    if (branchId) levelsQuery = levelsQuery.eq("branch_id", branchId);

    let transfersQuery = db
      .from("stock_transfers")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent");
    if (branchId) transfersQuery = transfersQuery.eq("to_branch_id", branchId);

    let adjQuery = db
      .from("stock_adjustments")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
    if (branchId) adjQuery = adjQuery.eq("branch_id", branchId);

    const productsQuery = db
      .from("products")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_active", true);

    const [levelsRes, transfersRes, adjRes, productsRes] = await Promise.all([
      levelsQuery, transfersQuery, adjQuery, productsQuery,
    ]);
    if (levelsRes.error) throw levelsRes.error;

    type LRow = { quantity: number; product_id: string; products: { cost_price: number } | null };
    const levels = levelsRes.data as LRow[];

    let totalUnits = 0;
    let totalValue = 0;
    let lowStock = 0;
    let outOfStock = 0;
    for (const l of levels) {
      const qty = Number(l.quantity);
      totalUnits += qty;
      totalValue += qty * (l.products?.cost_price ?? 0);
      if (qty === 0) outOfStock++;
      else if (qty <= LOW_STOCK_THRESHOLD) lowStock++;
    }

    return {
      totalProducts: productsRes.count ?? 0,
      totalStockUnits: totalUnits,
      totalStockValue: totalValue,
      lowStockCount: lowStock,
      outOfStockCount: outOfStock,
      pendingTransfers: transfersRes.count ?? 0,
      recentAdjustmentCount: adjRes.count ?? 0,
    };
  },
};
