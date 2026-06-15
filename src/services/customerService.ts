import { supabase } from '@/lib/supabase'
import type { Customer } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface CustomerFilters {
  search?:       string
  customerType?: string
  showInactive?: boolean
  showDeleted?:  boolean
}

export const customerService = {

  async getAll(filters: CustomerFilters = {}): Promise<Customer[]> {
    let query = db
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .order('full_name')

    if (!filters.showInactive) query = query.eq('is_active', true)
    if (filters.customerType)  query = query.eq('customer_type', filters.customerType)

    const { data, error } = await query
    if (error) throw error

    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (data as Customer[]).filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
    }
    return data as Customer[]
  },

  async getById(id: string): Promise<Customer> {
    const { data, error } = await db
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as Customer
  },

  async search(query: string, limit = 10): Promise<Customer[]> {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const { data, error } = await db
      .from('customers')
      .select('*')
      .is('deleted_at', null)
      .eq('is_active', true)
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order('full_name')
      .limit(limit)
    if (error) throw error
    return data as Customer[]
  },

  async create(data: Omit<Customer, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Customer> {
    const { data: result, error } = await db
      .from('customers')
      .insert({ ...data, is_active: true })
      .select()
      .single()
    if (error) throw error
    return result as Customer
  },

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Promise<Customer> {
    const { data: result, error } = await db
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as Customer
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await db
      .from('customers')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
    if (error) throw error
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db
      .from('customers')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) throw error
  },
}
