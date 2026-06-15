export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ────────────────────────────────────────────────────
export type UserRole = "admin" | "manager" | "teller";
export type Gender = "boy" | "girl" | "unisex" | "newborn";
export type PriceTier = "retail" | "wholesale";
export type AdjustmentType =
  | "damage"
  | "theft"
  | "correction"
  | "transfer_loss"
  | "other";
export type StockTakeStatus =
  | "draft"
  | "in_progress"
  | "completed"
  | "cancelled";
export type StockTransferStatus = "draft" | "sent" | "received" | "cancelled";
export type CustomerType = "walk_in" | "account" | "delivery";
export type OrderSource = "phone" | "whatsapp" | "walk_in" | "other";
export type DeliveryStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "dispatched"
  | "delivered"
  | "cancelled";
export type SaleType = "walk_in" | "delivery" | "account";
export type PaymentStatus = "paid" | "partial" | "pending";
export type PaymentMethod = "cash" | "mtn_momo" | "airtel_money";
export type ReturnType = "restock" | "writeoff";
export type ReturnStatus = "pending" | "approved" | "completed" | "rejected";
export type ReconciliationStatus = "open" | "submitted" | "approved";
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "void_sale"
  | "process_return"
  | "complete_sale"
  | "adjust_stock"
  | "receive_stock"
  | "send_transfer"
  | "receive_transfer"
  | "create_user"
  | "change_role"
  | "delete_user"
  | "close_reconciliation"
  | "complete_stock_take";

export const GENDERS: Gender[] = ["boy", "girl", "unisex", "newborn"];

// ─── Reference / Catalog Row Types ────────────────────────────
export interface Branch {
  id: string;
  name: string;
  code: string;
  is_main_store: boolean;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: string;
  name: string;
  hex_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GarmentType {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Size {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  branch_id: string;
  must_change_password: boolean;
  is_active: boolean;
  last_login_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Products ─────────────────────────────────────────────────
// Each product is one size+color SKU. Flat pricing (cost/retail/wholesale).
export interface Product {
  id: string;
  name: string;
  category_id: string;
  brand_id: string | null;
  garment_type_id: string | null;
  size_id: string | null;
  color_id: string | null;
  country_id: string | null;
  gender: Gender | null;
  age_text: string | null;
  store_location: string | null;
  pack_size: number;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProductBarcode {
  id: string;
  product_id: string;
  barcode: string;
  is_generated: boolean;
  created_at: string;
}

// ─── Inventory ────────────────────────────────────────────────
export interface StockLevel {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
  updated_at: string;
}

export interface StockReceiving {
  id: string;
  branch_id: string;
  reference: string | null;
  received_by: string;
  received_at: string;
  notes: string | null;
  created_at: string;
}

export interface StockReceivingItem {
  id: string;
  receiving_id: string;
  product_id: string;
  quantity: number;
  cost_price_per_unit: number;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_branch_id: string;
  to_branch_id: string;
  status: StockTransferStatus;
  notes: string | null;
  sent_by: string | null;
  sent_at: string | null;
  received_by: string | null;
  received_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity_sent: number;
  quantity_received: number | null;
  created_at: string;
}

export interface StockAdjustment {
  id: string;
  branch_id: string;
  product_id: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string | null;
  adjusted_by: string;
  created_at: string;
}

export interface StockTake {
  id: string;
  branch_id: string;
  status: StockTakeStatus;
  notes: string | null;
  started_by: string;
  completed_by: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockTakeItem {
  id: string;
  stock_take_id: string;
  product_id: string;
  system_quantity: number;
  counted_quantity: number | null;
  variance: number | null;
  notes: string | null;
  created_at: string;
}

// ─── Customers & Deliveries ───────────────────────────────────
export interface Customer {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  customer_type: CustomerType;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface DeliveryOrder {
  id: string;
  branch_id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  order_source: OrderSource;
  status: DeliveryStatus;
  delivery_address: string | null;
  delivery_notes: string | null;
  teller_id: string;
  sale_id: string | null;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryOrderItem {
  id: string;
  delivery_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

// ─── Sales ────────────────────────────────────────────────────
export interface Sale {
  id: string;
  branch_id: string;
  sale_number: string;
  customer_id: string | null;
  teller_id: string;
  sale_type: SaleType;
  delivery_order_id: string | null;
  total_amount: number;
  has_wholesale: boolean;
  payment_status: PaymentStatus;
  is_voided: boolean;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;
  receipt_printed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  price_tier: PriceTier;
  line_total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  reference_number: string | null;
  created_at: string;
}

// ─── Returns ──────────────────────────────────────────────────
export interface Return {
  id: string;
  branch_id: string;
  return_number: string;
  sale_id: string;
  customer_id: string | null;
  processed_by: string;
  approved_by: string | null;
  reason: string;
  return_type: ReturnType;
  status: ReturnStatus;
  total_refund: number;
  refund_method: PaymentMethod | null;
  notes: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  product_id: string;
  quantity_returned: number;
  refund_amount: number;
  restocked: boolean;
  created_at: string;
}

// ─── Reconciliation ───────────────────────────────────────────
export interface DailyReconciliation {
  id: string;
  branch_id: string;
  reconciliation_date: string;
  status: ReconciliationStatus;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
  expected_mtn_momo: number;
  actual_mtn_momo: number;
  mtn_momo_variance: number;
  expected_airtel_money: number;
  actual_airtel_money: number;
  airtel_variance: number;
  total_expected: number;
  total_actual: number;
  total_variance: number;
  submitted_by: string | null;
  approved_by: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationDenomination {
  id: string;
  reconciliation_id: string;
  denomination: number;
  count: number;
  total_amount: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── RPC Return Types ─────────────────────────────────────────
export interface CompleteSaleResult {
  sale_id: string;
  sale_number: string;
  total_amount: number;
  has_wholesale: boolean;
  payment_status: PaymentStatus;
}

export interface DashboardKPIs {
  today_revenue: number;
  today_transactions: number;
  today_wholesale_sales: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_transfers: number;
  top_products_today: Array<{
    name: string;
    qty: number;
    revenue: number;
  }> | null;
  payment_breakdown_today: Record<string, number> | null;
  branch_sales_today: Array<{
    name: string;
    code: string;
    revenue: number;
    transactions: number;
  }> | null;
}

export interface TellerSummary {
  transaction_count: number;
  total_sales: number;
  voided_count: number;
  wholesale_count: number;
  cash_total: number;
  mtn_momo_total: number;
  airtel_money_total: number;
}

export interface ProductSearchResult {
  product_id: string;
  product_name: string;
  brand_name: string | null;
  garment_type_name: string | null;
  size_name: string | null;
  color_name: string | null;
  barcode: string | null;
  pack_size: number;
  retail_price: number;
  wholesale_price: number;
  wholesale_threshold: number;
  stock_available: number;
}

export interface TransferReportRow {
  transfer_number: string;
  from_branch: string;
  to_branch: string;
  status: StockTransferStatus;
  items_count: number;
  total_sent: number;
  total_received: number;
  created_at: string;
  received_at: string | null;
}

// ─── Supabase Database Type ───────────────────────────────────
export type Database = {
  public: {
    Tables: {
      branches: {
        Row: Branch;
        Insert: Omit<Branch, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Branch, "id">>;
        Relationships: [];
      };
      countries: {
        Row: Country;
        Insert: Omit<Country, "id">;
        Update: Partial<Omit<Country, "id">>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Category, "id">>;
        Relationships: [];
      };
      brands: {
        Row: Brand;
        Insert: Omit<Brand, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Brand, "id">>;
        Relationships: [];
      };
      colors: {
        Row: Color;
        Insert: Omit<Color, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Color, "id">>;
        Relationships: [];
      };
      garment_types: {
        Row: GarmentType;
        Insert: Omit<GarmentType, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<GarmentType, "id">>;
        Relationships: [];
      };
      sizes: {
        Row: Size;
        Insert: Omit<Size, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Size, "id">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Omit<Product, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Product, "id">>;
        Relationships: [];
      };
      product_barcodes: {
        Row: ProductBarcode;
        Insert: Omit<ProductBarcode, "id" | "created_at">;
        Update: Partial<Omit<ProductBarcode, "id">>;
        Relationships: [];
      };
      stock_levels: {
        Row: StockLevel;
        Insert: Omit<StockLevel, "id" | "updated_at">;
        Update: Partial<Omit<StockLevel, "id">>;
        Relationships: [];
      };
      stock_receivings: {
        Row: StockReceiving;
        Insert: Omit<StockReceiving, "id" | "created_at">;
        Update: Partial<Omit<StockReceiving, "id">>;
        Relationships: [];
      };
      stock_receiving_items: {
        Row: StockReceivingItem;
        Insert: Omit<StockReceivingItem, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      stock_transfers: {
        Row: StockTransfer;
        Insert: Omit<StockTransfer, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StockTransfer, "id">>;
        Relationships: [];
      };
      stock_transfer_items: {
        Row: StockTransferItem;
        Insert: Omit<StockTransferItem, "id" | "created_at">;
        Update: Partial<Omit<StockTransferItem, "id">>;
        Relationships: [];
      };
      stock_adjustments: {
        Row: StockAdjustment;
        Insert: Omit<StockAdjustment, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      stock_takes: {
        Row: StockTake;
        Insert: Omit<StockTake, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StockTake, "id">>;
        Relationships: [];
      };
      stock_take_items: {
        Row: StockTakeItem;
        Insert: Omit<StockTakeItem, "id" | "variance" | "created_at">;
        Update: Partial<Omit<StockTakeItem, "id">>;
        Relationships: [];
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Customer, "id">>;
        Relationships: [];
      };
      delivery_orders: {
        Row: DeliveryOrder;
        Insert: Omit<DeliveryOrder, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DeliveryOrder, "id">>;
        Relationships: [];
      };
      delivery_order_items: {
        Row: DeliveryOrderItem;
        Insert: Omit<DeliveryOrderItem, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Sale, "id">>;
        Relationships: [];
      };
      sale_items: {
        Row: SaleItem;
        Insert: Omit<SaleItem, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      returns: {
        Row: Return;
        Insert: Omit<Return, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Return, "id">>;
        Relationships: [];
      };
      return_items: {
        Row: ReturnItem;
        Insert: Omit<ReturnItem, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
      daily_reconciliations: {
        Row: DailyReconciliation;
        Insert: Omit<
          DailyReconciliation,
          | "id"
          | "cash_variance"
          | "mtn_momo_variance"
          | "airtel_variance"
          | "total_expected"
          | "total_actual"
          | "total_variance"
          | "created_at"
          | "updated_at"
        >;
        Update: Partial<Omit<DailyReconciliation, "id">>;
        Relationships: [];
      };
      reconciliation_denominations: {
        Row: ReconciliationDenomination;
        Insert: Omit<
          ReconciliationDenomination,
          "id" | "total_amount" | "created_at"
        >;
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      complete_sale: { Args: { p_data: Json }; Returns: Json };
      void_sale: {
        Args: { p_sale_id: string; p_reason: string };
        Returns: Json;
      };
      process_return: { Args: { p_data: Json }; Returns: Json };
      receive_stock: { Args: { p_data: Json }; Returns: Json };
      create_stock_transfer: { Args: { p_data: Json }; Returns: Json };
      confirm_stock_transfer: { Args: { p_data: Json }; Returns: Json };
      cancel_stock_transfer: { Args: { p_transfer_id: string }; Returns: Json };
      apply_stock_adjustment: { Args: { p_data: Json }; Returns: Json };
      complete_stock_take: { Args: { p_stock_take_id: string }; Returns: Json };
      get_teller_summary: {
        Args: {
          p_teller_id: string;
          p_date_from: string;
          p_date_to: string;
          p_branch_id?: string;
        };
        Returns: Json;
      };
      get_dashboard_kpis: { Args: { p_branch_id?: string }; Returns: Json };
      get_sales_report: {
        Args: {
          p_date_from: string;
          p_date_to: string;
          p_branch_id?: string;
          p_teller_id?: string;
          p_sale_type?: string;
        };
        Returns: unknown[];
      };
      get_stock_valuation: {
        Args: { p_branch_id?: string };
        Returns: unknown[];
      };
      get_goods_received: {
        Args: { p_date_from?: string; p_date_to?: string };
        Returns: unknown[];
      };
      get_transfer_report: {
        Args: { p_date_from: string; p_date_to: string; p_branch_id?: string };
        Returns: unknown[];
      };
      get_reconciliation_preview: {
        Args: { p_date: string; p_branch_id?: string };
        Returns: Json;
      };
      close_reconciliation: { Args: { p_data: Json }; Returns: Json };
      admin_setup_new_user: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_email: string;
          p_role: UserRole;
          p_branch_id: string;
        };
        Returns: void;
      };
      admin_soft_delete_user: {
        Args: { p_user_id: string; p_email: string };
        Returns: void;
      };
      search_products: {
        Args: { p_query: string; p_branch_id?: string };
        Returns: ProductSearchResult[];
      };
      get_product_by_barcode: {
        Args: { p_barcode: string; p_branch_id?: string };
        Returns: Json;
      };
      get_wholesale_threshold: { Args: Record<string, never>; Returns: number };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_admin_or_manager: { Args: Record<string, never>; Returns: boolean };
      get_user_role: { Args: Record<string, never>; Returns: UserRole };
      get_user_branch_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      user_role: UserRole;
      gender: Gender;
      price_tier: PriceTier;
      adjustment_type: AdjustmentType;
      stock_take_status: StockTakeStatus;
      stock_transfer_status: StockTransferStatus;
      customer_type: CustomerType;
      order_source: OrderSource;
      delivery_status: DeliveryStatus;
      sale_type: SaleType;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      return_type: ReturnType;
      return_status: ReturnStatus;
      reconciliation_status: ReconciliationStatus;
      audit_action: AuditAction;
    };
  };
};

// ════════════════════════════════════════════════════════════════
// TRANSITIONAL / LEGACY TYPES — removed from the schema in the
// garment-store revamp. Kept ONLY so not-yet-migrated inventory/POS/
// report modules keep type-checking between phases. Do NOT use in new
// code; these are deleted once Phases 4–6 are complete.
// ════════════════════════════════════════════════════════════════
export type DosageForm = string;
export type POStatus =
  | "draft"
  | "sent"
  | "partially_received"
  | "received"
  | "cancelled";
export type EfrisStatus = "pending" | "submitted" | "failed" | "not_applicable";

export interface Manufacturer {
  id: string;
  name: string;
  country_id: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tin: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductUnit {
  id: string;
  product_id: string;
  unit_name: string;
  conversion_factor: number;
  price_before_vat: number;
  vat_amount: number;
  selling_price: number;
  cost_price: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockBatch {
  id: string;
  product_id: string;
  product_unit_id: string;
  branch_id: string;
  supplier_id: string | null;
  batch_number: string;
  stock_in_date: string;
  expiry_date: string | null;
  quantity_received: number;
  quantity_remaining: number;
  cost_price_per_unit: number;
  receiving_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_id: string;
  po_number: string;
  status: POStatus;
  order_date: string;
  expected_delivery_date: string | null;
  notes: string | null;
  subtotal: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  product_unit_id: string;
  quantity_ordered: number;
  quantity_received: number;
  cost_price_per_unit: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}

export interface VatRate {
  id: string;
  rate: number;
  is_default: boolean;
  effective_from: string;
  effective_to: string | null;
  description: string | null;
  created_at: string;
}
