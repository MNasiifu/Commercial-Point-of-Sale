import { z } from 'zod'

export const denominationSchema = z.object({
  denomination: z.number(),
  count:        z.number().int().min(0),
  label:        z.string(),
})

export const reconciliationSchema = z.object({
  branch_id:           z.string().uuid(),
  reconciliation_date: z.string().min(1, 'Date is required'),
  actual_mtn_momo:     z.number().min(0, 'Cannot be negative'),
  actual_airtel_money: z.number().min(0, 'Cannot be negative'),
  notes:               z.string().nullable(),
  denominations:       z.array(denominationSchema),
})

export type ReconciliationFormValues = z.infer<typeof reconciliationSchema>
export type DenominationValue = z.infer<typeof denominationSchema>
