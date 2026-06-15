import { supabase } from '@/lib/supabase'
import type { Country } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface CountryFilters {
  search?: string
  showInactive?: boolean
}

export const countryService = {
  async getAll(filters: CountryFilters = {}): Promise<Country[]> {
    let query = db.from('countries').select('*').order('name')
    if (!filters.showInactive) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error

    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (data as Country[]).filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code?.toLowerCase().includes(q),
      )
    }
    return data as Country[]
  },

  async create(data: { name: string; code?: string | null }): Promise<Country> {
    const { data: result, error } = await db
      .from('countries')
      .insert({
        name: data.name,
        code: data.code?.trim() ? data.code.trim().toUpperCase() : null,
        is_active: true,
      })
      .select()
      .single()
    if (error) throw error
    return result as Country
  },

  async update(
    id: string,
    data: Partial<Pick<Country, 'name' | 'code' | 'is_active'>>,
  ): Promise<Country> {
    const payload = { ...data }
    if (payload.code !== undefined) {
      payload.code = payload.code?.trim()
        ? payload.code.trim().toUpperCase()
        : null
    }
    const { data: result, error } = await db
      .from('countries')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as Country
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await db.from('countries').update({ is_active: false }).eq('id', id)
    if (error) throw error
  },
}
