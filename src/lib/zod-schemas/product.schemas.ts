import { z } from 'zod'

// Gender options for the product form dropdown
export const GENDER_OPTIONS = [
  { value: 'boy',     label: 'Boy' },
  { value: 'girl',    label: 'Girl' },
  { value: 'unisex',  label: 'Unisex' },
  { value: 'newborn', label: 'Newborn' },
] as const

// A product is one size+color SKU of a children's garment.
export const productSchema = z.object({
  name:            z.string().min(2, 'Product name must be at least 2 characters').max(200),
  category_id:     z.string().uuid('Category is required'),
  brand_id:        z.string().uuid().optional().nullable(),
  garment_type_id: z.string().uuid().optional().nullable(),
  size_id:         z.string().uuid().optional().nullable(),
  color_id:        z.string().uuid().optional().nullable(),
  country_id:      z.string().uuid().optional().nullable(),
  gender:          z.enum(['boy', 'girl', 'unisex', 'newborn']).optional().nullable(),
  age_text:        z.string().max(100).optional().nullable(),
  store_location:  z.string().max(100).optional().nullable(),
  pack_size:       z.coerce.number().int('Whole number').min(1, 'At least 1 piece per pack').default(1),
  cost_price:      z.coerce.number().min(0, 'Cost must be 0 or more').default(0),
  retail_price:    z.coerce.number().min(0, 'Retail price must be 0 or more'),
  wholesale_price: z.coerce.number().min(0, 'Wholesale price must be 0 or more').default(0),
  description:     z.string().max(1000).optional().nullable(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const createProductSchema = z.object({
  product:  productSchema,
  barcodes: z.array(z.string()).default([]),
})

export type CreateProductFormValues = z.infer<typeof createProductSchema>
