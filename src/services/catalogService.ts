import { supabase } from '@/lib/supabase'
import type { Brand, Color, GarmentType, Size } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export interface CatalogFilters {
  search?: string
  showInactive?: boolean
}

export interface CatalogBase {
  id: string
  name: string
  is_active: boolean
}

export interface CatalogService<T extends CatalogBase> {
  getAll(filters?: CatalogFilters): Promise<T[]>
  create(payload: Partial<T>): Promise<T>
  update(id: string, payload: Partial<T>): Promise<T>
  deactivate(id: string): Promise<void>
}

/**
 * Generic CRUD service for a simple catalog list (name + a few attributes,
 * is_active soft-deactivation). Used for brands, colors, garment types, sizes.
 */
export function makeCatalogService<T extends CatalogBase>(
  table: string,
  opts: { orderBy?: string; searchFields?: (keyof T)[] } = {},
): CatalogService<T> {
  const orderBy = opts.orderBy ?? 'name'
  const searchFields = (opts.searchFields ?? (['name'] as (keyof T)[]))

  return {
    async getAll(filters: CatalogFilters = {}): Promise<T[]> {
      let query = db.from(table).select('*').order(orderBy)
      if (!filters.showInactive) query = query.eq('is_active', true)
      const { data, error } = await query
      if (error) throw error
      if (filters.search) {
        const q = filters.search.toLowerCase()
        return (data as T[]).filter((r) =>
          searchFields.some((f) => String(r[f] ?? '').toLowerCase().includes(q)),
        )
      }
      return data as T[]
    },

    async create(payload: Partial<T>): Promise<T> {
      const { data, error } = await db
        .from(table)
        .insert({ ...payload, is_active: true })
        .select()
        .single()
      if (error) throw error
      return data as T
    },

    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data, error } = await db
        .from(table)
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as T
    },

    async deactivate(id: string): Promise<void> {
      const { error } = await db.from(table).update({ is_active: false }).eq('id', id)
      if (error) throw error
    },
  }
}

export const brandService       = makeCatalogService<Brand>('brands', { searchFields: ['name', 'description'] })
export const colorService       = makeCatalogService<Color>('colors', { searchFields: ['name'] })
export const garmentTypeService = makeCatalogService<GarmentType>('garment_types', { searchFields: ['name', 'description'] })
export const sizeService        = makeCatalogService<Size>('sizes', { orderBy: 'sort_order', searchFields: ['name'] })
