import { supabase } from '@/lib/supabase'
import type { Category } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface CategoryFilters {
  search?: string
  showInactive?: boolean
}

export const categoryService = {
  async getAll(filters: CategoryFilters = {}): Promise<Category[]> {
    let query = db.from('categories').select('*').order('name')
    if (!filters.showInactive) query = query.eq('is_active', true)

    const { data, error } = await query
    if (error) throw error

    if (filters.search) {
      const q = filters.search.toLowerCase()
      return (data as Category[]).filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q),
      )
    }
    return data as Category[]
  },

  async create(data: { name: string; description?: string | null }): Promise<Category> {
    const { data: result, error } = await db
      .from('categories')
      .insert({ name: data.name, description: data.description ?? null, is_active: true })
      .select()
      .single()
    if (error) throw error
    return result as Category
  },

  async update(
    id: string,
    data: Partial<Pick<Category, 'name' | 'description' | 'is_active'>>,
  ): Promise<Category> {
    const { data: result, error } = await db
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return result as Category
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await db.from('categories').update({ is_active: false }).eq('id', id)
    if (error) throw error
  },
}
