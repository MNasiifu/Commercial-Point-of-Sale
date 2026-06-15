import { supabase } from '@/lib/supabase'
import type { Sale, SaleItem, Payment, Customer, Profile } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

const SALE_SELECT = `
  *,
  customers(id, full_name, phone),
  profiles!teller_id(id, full_name),
  branches(name, code),
  sale_items(
    *,
    products(id, name, sizes(name), colors(name))
  ),
  payments(*)
` as const

export interface SaleWithDetails extends Sale {
  customers:  Pick<Customer, 'id' | 'full_name' | 'phone'> | null
  profiles:   Pick<Profile,  'id' | 'full_name'> | null
  branches:   { name: string; code: string } | null
  sale_items: Array<
    SaleItem & {
      products: {
        id: string
        name: string
        sizes: { name: string } | null
        colors: { name: string } | null
      } | null
    }
  >
  payments: Payment[]
}

export interface SaleFilters {
  search?:   string
  dateFrom?: string
  dateTo?:   string
  saleType?: string
  showVoided?: boolean
}

export const salesService = {

  async getAll(filters: SaleFilters = {}): Promise<SaleWithDetails[]> {
    let query = db
      .from('sales')
      .select(SALE_SELECT)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!filters.showVoided) query = query.eq('is_voided', false)
    if (filters.saleType)   query = query.eq('sale_type', filters.saleType)
    if (filters.dateFrom)   query = query.gte('created_at', filters.dateFrom)
    if (filters.dateTo)     query = query.lte('created_at', filters.dateTo + 'T23:59:59')

    const { data, error } = await query
    if (error) throw error

    let results = data as unknown as SaleWithDetails[]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        (s) =>
          s.sale_number.toLowerCase().includes(q) ||
          s.customers?.full_name?.toLowerCase().includes(q) ||
          s.customers?.phone?.toLowerCase().includes(q)
      )
    }

    return results
  },

  async getById(id: string): Promise<SaleWithDetails> {
    const { data, error } = await db
      .from('sales')
      .select(SALE_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as SaleWithDetails
  },

  async voidSale(saleId: string, reason: string): Promise<{ success: boolean; sale_id: string }> {
    const { data, error } = await db.rpc('void_sale', {
      p_sale_id: saleId,
      p_reason:  reason,
    })
    if (error) throw error
    const result = data as { success: boolean; sale_id: string; error?: string }
    if (!result.success) throw new Error(result.error ?? 'Failed to void sale')
    return result
  },
}
