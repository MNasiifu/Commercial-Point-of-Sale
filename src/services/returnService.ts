import { supabase } from '@/lib/supabase'
import type { Return, ReturnItem, Sale, Customer } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const RETURN_SELECT = `
  *,
  sales(id, sale_number),
  customers(id, full_name, phone),
  return_items(
    *,
    products(id, name, sizes(name), colors(name))
  )
` as const

export interface ReturnWithDetails extends Return {
  sales:     Pick<Sale, 'id' | 'sale_number'> | null
  customers: Pick<Customer, 'id' | 'full_name' | 'phone'> | null
  return_items: Array<
    ReturnItem & {
      products: {
        id: string
        name: string
        sizes: { name: string } | null
        colors: { name: string } | null
      } | null
    }
  >
}

export interface ProcessReturnPayload {
  branch_id:     string
  sale_id:       string
  customer_id:   string | null
  reason:        string
  return_type:   'restock' | 'writeoff'
  refund_method: 'cash' | 'mtn_momo' | 'airtel_money' | null
  notes:         string | null
  items: Array<{
    sale_item_id:      string
    product_id:        string
    quantity_returned: number
    refund_amount:     number
  }>
}

export interface ProcessReturnResult {
  return_id:     string
  return_number: string
  total_refund:  number
}

export interface ReturnFilters {
  search?:     string
  status?:     string
  returnType?: string
  dateFrom?:   string
  dateTo?:     string
}

export const returnService = {

  async processReturn(payload: ProcessReturnPayload): Promise<ProcessReturnResult> {
    const { data, error } = await db.rpc('process_return', { p_data: payload })
    if (error) throw error
    return data as ProcessReturnResult
  },

  async getAll(filters: ReturnFilters = {}): Promise<ReturnWithDetails[]> {
    let query = db
      .from('returns')
      .select(RETURN_SELECT)
      .order('created_at', { ascending: false })
      .limit(200)

    if (filters.status)     query = query.eq('status', filters.status)
    if (filters.returnType) query = query.eq('return_type', filters.returnType)
    if (filters.dateFrom)   query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo)     query = query.lte('created_at', filters.dateTo + 'T23:59:59')

    const { data, error } = await query
    if (error) throw error

    let results = data as unknown as ReturnWithDetails[]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (r) =>
          r.return_number.toLowerCase().includes(q) ||
          r.sales?.sale_number?.toLowerCase().includes(q) ||
          r.customers?.full_name?.toLowerCase().includes(q)
      )
    }

    return results
  },

  async getById(id: string): Promise<ReturnWithDetails> {
    const { data, error } = await db
      .from('returns')
      .select(RETURN_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as ReturnWithDetails
  },
}
