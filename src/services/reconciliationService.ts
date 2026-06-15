import { supabase } from '@/lib/supabase'
import type { DailyReconciliation, ReconciliationDenomination } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReconciliationPreview {
  reconciliation_date:       string
  expected_cash:             number
  expected_mtn_momo:         number
  expected_airtel_money:     number
  total_expected:            number
  transaction_count:         number
  existing_id:               string | null
  existing_status:           string | null
  existing_actual_cash:      number | null
  existing_actual_mtn_momo:  number | null
  existing_actual_airtel:    number | null
  existing_notes:            string | null
}

export interface CloseReconciliationPayload {
  branch_id:           string
  reconciliation_date: string
  actual_cash:         number
  actual_mtn_momo:     number
  actual_airtel_money: number
  notes:               string | null
  denominations:       Array<{ denomination: number; count: number }>
}

export interface CloseReconciliationResult {
  success:           boolean
  reconciliation_id: string
  total_expected:    number
  total_actual:      number
  total_variance:    number
}

export interface ReconciliationWithDenominations extends DailyReconciliation {
  reconciliation_denominations: ReconciliationDenomination[]
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const reconciliationService = {

  async getPreview(date: string, branchId: string | null): Promise<ReconciliationPreview> {
    const { data, error } = await db.rpc('get_reconciliation_preview', {
      p_date:      date,
      p_branch_id: branchId,
    })
    if (error) throw error
    return data as ReconciliationPreview
  },

  async close(payload: CloseReconciliationPayload): Promise<CloseReconciliationResult> {
    const { data, error } = await db.rpc('close_reconciliation', { p_data: payload })
    if (error) throw error
    const result = data as CloseReconciliationResult & { error?: string }
    if (!result.success) throw new Error(result.error ?? 'Failed to submit reconciliation')
    return result
  },

  async getAll(branchId: string | null): Promise<DailyReconciliation[]> {
    let query = db
      .from('daily_reconciliations')
      .select('*')
      .order('reconciliation_date', { ascending: false })
      .limit(90)
    if (branchId) query = query.eq('branch_id', branchId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as DailyReconciliation[]
  },

  async getById(id: string): Promise<ReconciliationWithDenominations> {
    const { data, error } = await db
      .from('daily_reconciliations')
      .select('*, reconciliation_denominations(*)')
      .eq('id', id)
      .single()
    if (error) throw error
    return data as unknown as ReconciliationWithDenominations
  },
}
