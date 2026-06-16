import { supabase } from '@/lib/supabase'
import type {
  Product, ProductBarcode,
  Category, Brand, Color, GarmentType, Size, Country,
} from '@/types/database.types'

// Our Database type uses named interfaces for Row/Insert/Update which don't
// satisfy Supabase's internal Record<string,unknown> constraint at the type
// level. Service methods keep explicit return types — runtime is correct.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Join type used throughout the product module ─────────────
export interface ProductWithDetails extends Product {
  categories:       Pick<Category,    'id' | 'name'> | null
  brands:           Pick<Brand,       'id' | 'name'> | null
  garment_types:    Pick<GarmentType, 'id' | 'name'> | null
  sizes:            Pick<Size,        'id' | 'name'> | null
  colors:           Pick<Color,       'id' | 'name' | 'hex_code'> | null
  countries:        Pick<Country,     'id' | 'name' | 'code'> | null
  product_barcodes: Pick<ProductBarcode, 'id' | 'barcode' | 'is_generated'>[]
}

const PRODUCT_SELECT = `
  *,
  categories(id, name),
  brands(id, name),
  garment_types(id, name),
  sizes(id, name),
  colors(id, name, hex_code),
  countries(id, name, code),
  product_barcodes(id, barcode, is_generated)
` as const

export interface ProductFilters {
  search?:        string
  categoryId?:    string
  brandId?:       string
  garmentTypeId?: string
  sizeId?:        string
  colorId?:       string
  gender?:        string
  showInactive?:  boolean
}

export const productService = {

  async getAll(filters: ProductFilters = {}): Promise<ProductWithDetails[]> {
    // List + search are resolved entirely in the DB via the search_products
    // RPC (migration 020). It returns rows already shaped like
    // ProductWithDetails (nested relations + barcodes), case-insensitive
    // substring search across name / store_location / barcode / category /
    // brand / garment-type names.
    const { data, error } = await db.rpc('search_products', {
      p_search:          filters.search ?? null,
      p_category_id:     filters.categoryId ?? null,
      p_brand_id:        filters.brandId ?? null,
      p_garment_type_id: filters.garmentTypeId ?? null,
      p_size_id:         filters.sizeId ?? null,
      p_color_id:        filters.colorId ?? null,
      p_gender:          filters.gender ?? null,
      p_show_inactive:   filters.showInactive ?? null,
    })
    if (error) throw error
    return (data ?? []) as ProductWithDetails[]
  },

  async getById(id: string): Promise<ProductWithDetails> {
    const { data, error } = await db
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('id', id)
      .single()
    if (error) throw error
    return data as ProductWithDetails
  },

  async create(
    product:  Omit<Product, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
    barcodes: { barcode: string; is_generated: boolean }[],
  ): Promise<ProductWithDetails> {
    const { data: prod, error: prodErr } = await db
      .from('products')
      .insert(product)
      .select()
      .single()
    if (prodErr) throw prodErr

    if (barcodes.length > 0) {
      const { error: bcErr } = await db
        .from('product_barcodes')
        .insert(barcodes.map((b) => ({ ...b, product_id: prod.id })))
      if (bcErr) {
        await db.from('products').update({ deleted_at: new Date().toISOString() }).eq('id', prod.id)
        throw bcErr
      }
    }
    return productService.getById(prod.id)
  },

  async update(id: string, data: Partial<Omit<Product, 'id' | 'created_at'>>): Promise<ProductWithDetails> {
    const { error } = await db
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    return productService.getById(id)
  },

  async softDelete(id: string): Promise<void> {
    const { error } = await db
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq('id', id)
    if (error) throw error
  },

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    const { error } = await db.from('products').update({ is_active: isActive }).eq('id', id)
    if (error) throw error
  },

  // ─── Barcodes ─────────────────────────────────────────────
  async addBarcode(productId: string, barcode: string, isGenerated: boolean): Promise<ProductBarcode> {
    const { data, error } = await db
      .from('product_barcodes')
      .insert({ product_id: productId, barcode, is_generated: isGenerated })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteBarcode(barcodeId: string): Promise<void> {
    const { error } = await db.from('product_barcodes').delete().eq('id', barcodeId)
    if (error) throw error
  },

  // ─── Catalog reference data (dropdowns) ────────────────────
  async getCategories(): Promise<Category[]> {
    const { data, error } = await db.from('categories').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data
  },

  async getBrands(): Promise<Brand[]> {
    const { data, error } = await db.from('brands').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data
  },

  async getColors(): Promise<Color[]> {
    const { data, error } = await db.from('colors').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data
  },

  async getGarmentTypes(): Promise<GarmentType[]> {
    const { data, error } = await db.from('garment_types').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data
  },

  async getSizes(): Promise<Size[]> {
    const { data, error } = await db.from('sizes').select('*').eq('is_active', true).order('sort_order')
    if (error) throw error
    return data
  },

  async getCountries(): Promise<Country[]> {
    const { data, error } = await db.from('countries').select('*').eq('is_active', true).order('name')
    if (error) throw error
    return data
  },
}
