import { supabase } from '@/lib/supabase'
import type { DashboardKPIs, TellerSummary } from '@/types/database.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const dashboardService = {

  async getKPIs(branchId?: string | null): Promise<DashboardKPIs> {
    const { data, error } = await db.rpc('get_dashboard_kpis', {
      p_branch_id: branchId ?? null,
    })
    if (error) throw error
    return data as DashboardKPIs
  },

  async getTellerSummary(opts: {
    tellerId?:  string | null
    dateFrom?:  string | null
    dateTo?:    string | null
    branchId?:  string | null
  } = {}): Promise<TellerSummary> {
    const { data, error } = await db.rpc('get_teller_summary', {
      p_teller_id: opts.tellerId  ?? null,
      p_date_from: opts.dateFrom  ?? null,
      p_date_to:   opts.dateTo    ?? null,
      p_branch_id: opts.branchId  ?? null,
    })
    if (error) throw error
    return data as TellerSummary
  },
}
