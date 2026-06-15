import { z } from 'zod'

export const ADJUSTMENT_TYPES = [
  'damage', 'theft', 'correction', 'transfer_loss', 'other',
] as const

export const ADJUSTMENT_LABELS: Record<string, string> = {
  damage:        'Damage',
  theft:         'Theft',
  correction:    'Correction',
  transfer_loss: 'Transfer loss',
  other:         'Other',
}

// ─── Stock Adjustment Form ──────────────────────────────────
// quantity is the signed change applied to on-hand stock at a branch
// (positive = add, negative = remove).
export const stockAdjustmentSchema = z.object({
  branch_id:       z.string().uuid('Select a branch'),
  product_id:      z.string().uuid('Select a product'),
  adjustment_type: z.enum(ADJUSTMENT_TYPES, { required_error: 'Select adjustment type' }),
  quantity:        z.coerce.number().refine((v) => v !== 0, 'Quantity cannot be zero'),
  reason:          z.string().min(3, 'Reason must be at least 3 characters').max(500),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>

// ─── Stock Transfer Form ────────────────────────────────────
export const transferItemSchema = z.object({
  product_id: z.string().uuid('Select a product'),
  quantity:   z.coerce.number().positive('Quantity must be positive'),
})

export const stockTransferSchema = z.object({
  to_branch_id: z.string().uuid('Select a destination branch'),
  notes:        z.string().max(500).nullable().optional(),
  items:        z.array(transferItemSchema).min(1, 'Add at least one item'),
})

export type StockTransferFormValues = z.infer<typeof stockTransferSchema>

// ─── Stock Take ─────────────────────────────────────────────
export const stockTakeCreateSchema = z.object({
  notes: z.string().max(500).optional(),
})

export type StockTakeCreateFormValues = z.infer<typeof stockTakeCreateSchema>
