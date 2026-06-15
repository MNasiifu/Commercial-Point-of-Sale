import { z } from 'zod'

export const customerSchema = z.object({
  full_name:     z.string().min(2, 'Name must be at least 2 characters').max(200),
  phone:         z.string().max(20).optional().nullable(),
  email:         z.string().email('Invalid email address').max(200).optional().nullable().or(z.literal('')),
  address:       z.string().max(500).optional().nullable(),
  customer_type: z.enum(['walk_in', 'account', 'delivery']).default('account'),
  notes:         z.string().max(500).optional().nullable(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const deliveryOrderSchema = z.object({
  customer_id:      z.string().uuid().optional().nullable(),
  customer_name:    z.string().min(2, 'Customer name required').max(200),
  customer_phone:   z.string().max(20).optional().nullable(),
  order_source:     z.enum(['phone', 'whatsapp', 'walk_in', 'other']).default('phone'),
  delivery_address: z.string().max(500).optional().nullable(),
  delivery_notes:   z.string().max(500).optional().nullable(),
  items: z.array(
    z.object({
      product_id:   z.string().uuid(),
      product_name: z.string(),
      sub:          z.string(),
      quantity:     z.coerce.number().positive('Quantity must be positive'),
      unit_price:   z.number().positive(),
      line_total:   z.number().positive(),
    })
  ).min(1, 'At least one item is required'),
})

export type DeliveryOrderFormValues = z.infer<typeof deliveryOrderSchema>
