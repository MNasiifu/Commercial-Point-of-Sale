import { supabase } from '@/lib/supabase'
import type { PriceTier, SaleType, StockTransferStatus } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Row types ────────────────────────────────────────────────────────────────

/** One product line within a transaction, embedded by get_sales_report. */
export interface SalesReportItem {
  product_name: string
  quantity:     number
  unit_price:   number
  price_tier:   PriceTier
  amount:       number
}

export interface SalesReportRow {
  sale_number:     string
  sale_date:       string
  branch_name:     string | null
  teller_name:     string | null
  customer_name:   string | null
  sale_type:       SaleType
  items_count:     number
  has_wholesale:   boolean
  total_amount:    number
  payment_methods: string
  is_voided:       boolean
  items:           SalesReportItem[]
}

export interface GoodsReceivedRow {
  id:            string
  received_at:   string
  reference:     string | null
  product_name:  string
  category_name: string | null
  branch_name:   string | null
  received_by:   string | null
  quantity:      number
  cost_price:    number
  cost_value:    number
}

export interface TransferReportRow {
  transfer_number: string
  from_branch:     string
  to_branch:       string
  status:          StockTransferStatus
  items_count:     number
  total_sent:      number
  total_received:  number
  created_at:      string
  received_at:     string | null
}

export interface TellerOption {
  id:        string
  full_name: string
}

// ─── Filter types ─────────────────────────────────────────────────────────────

export interface SalesReportFilters {
  dateFrom:    string
  dateTo:      string
  branchId?:   string | null
  tellerId?:   string | null
  saleType?:   SaleType | ''
  categoryId?: string | null
}

export interface GoodsReceivedFilters {
  dateFrom: string
  dateTo:   string
}

export interface TransferReportFilters {
  dateFrom:  string
  dateTo:    string
  branchId?: string | null
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const reportService = {

  async getSalesReport(f: SalesReportFilters): Promise<SalesReportRow[]> {
    const { data, error } = await db.rpc('get_sales_report', {
      p_date_from:   f.dateFrom,
      p_date_to:     f.dateTo,
      p_branch_id:   f.branchId ?? null,
      p_teller_id:   f.tellerId ?? null,
      p_sale_type:   f.saleType || null,
      p_category_id: f.categoryId ?? null,
    })
    if (error) throw error
    return (data ?? []) as SalesReportRow[]
  },

  async getGoodsReceived(f: GoodsReceivedFilters): Promise<GoodsReceivedRow[]> {
    const { data, error } = await db.rpc('get_goods_received', {
      p_date_from: f.dateFrom,
      p_date_to:   f.dateTo,
    })
    if (error) throw error
    return (data ?? []) as GoodsReceivedRow[]
  },

  async getTransferReport(f: TransferReportFilters): Promise<TransferReportRow[]> {
    const { data, error } = await db.rpc('get_transfer_report', {
      p_date_from: f.dateFrom,
      p_date_to:   f.dateTo,
      p_branch_id: f.branchId ?? null,
    })
    if (error) throw error
    return (data ?? []) as TransferReportRow[]
  },

  async getTellers(): Promise<TellerOption[]> {
    const { data, error } = await db
      .from('profiles')
      .select('id, full_name')
      .in('role', ['admin', 'manager', 'teller'])
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('full_name')
    if (error) throw error
    return (data ?? []) as TellerOption[]
  },
}
