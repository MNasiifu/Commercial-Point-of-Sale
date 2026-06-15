import { z } from 'zod'

export const categorySchema = z.object({
  name:        z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().nullable(),
})
export type CategoryFormValues = z.infer<typeof categorySchema>

export const countrySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim().toUpperCase() : ''))
    .refine((v) => v === '' || /^[A-Z]{2}$/.test(v), {
      message: 'Code must be two uppercase letters',
    }),
})
export type CountryFormValues = z.infer<typeof countrySchema>

// ─── Garment catalog lists ────────────────────────────────────
export const brandSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().nullable(),
})
export type BrandFormValues = z.infer<typeof brandSchema>

export const garmentTypeSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(200),
  description: z.string().max(500).optional().nullable(),
})
export type GarmentTypeFormValues = z.infer<typeof garmentTypeSchema>

export const colorSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100),
  hex_code: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : ''))
    .refine((v) => v === '' || /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v), {
      message: 'Use a hex colour like #FF8800',
    }),
})
export type ColorFormValues = z.infer<typeof colorSchema>

export const sizeSchema = z.object({
  name:       z.string().min(1, 'Name is required').max(50),
  sort_order: z.coerce.number().int('Whole number').min(0).default(0),
})
export type SizeFormValues = z.infer<typeof sizeSchema>
