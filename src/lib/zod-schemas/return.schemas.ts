import { z } from 'zod'

export const voidSaleSchema = z.object({
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
})

export type VoidSaleFormValues = z.infer<typeof voidSaleSchema>

export const returnLineSchema = z.object({
  sale_item_id:      z.string().uuid(),
  product_id:        z.string().uuid(),
  quantity_returned: z.number().int().min(1, 'Quantity must be at least 1'),
  max_quantity:      z.number().int().min(1),
  unit_price:        z.number(),
  refund_amount:     z.number().min(0),
  product_name:      z.string(),
  sub:               z.string(),
  selected:          z.boolean(),
})

export const processReturnSchema = z.object({
  sale_id:       z.string().uuid(),
  branch_id:     z.string().uuid(),
  customer_id:   z.string().uuid().nullable(),
  reason:        z.string().min(5, 'Reason must be at least 5 characters'),
  return_type:   z.enum(['restock', 'writeoff']),
  refund_method: z.enum(['cash', 'mtn_momo', 'airtel_money']).nullable(),
  notes:         z.string().nullable(),
  lines:         z.array(returnLineSchema),
}).superRefine((val, ctx) => {
  const selected = val.lines.filter((l) => l.selected)
  if (selected.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lines'],
      message: 'Select at least one item to return',
    })
  }
  selected.forEach((l, i) => {
    if (l.quantity_returned > l.max_quantity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lines', i, 'quantity_returned'],
        message: `Cannot return more than ${l.max_quantity}`,
      })
    }
  })
})

export type ProcessReturnFormValues = z.infer<typeof processReturnSchema>
export type ReturnLineValue = z.infer<typeof returnLineSchema>
