import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '@/services/dashboardService'
import { useAuthStore }     from '@/store/authStore'

const DASHBOARD_KEY  = 'dashboard-kpis'
const TELLER_SUM_KEY = 'teller-summary'
const REFETCH_MS     = 60_000  // refresh every 60 s

export function useDashboardKPIs(branchId?: string | null) {
  const own = useAuthStore((s) => s.profile?.branch_id ?? null)
  const scoped = branchId === undefined ? own : branchId

  return useQuery({
    queryKey:       [DASHBOARD_KEY, scoped],
    queryFn:        () => dashboardService.getKPIs(scoped),
    staleTime:      REFETCH_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useTellerSummary(opts: {
  tellerId?: string | null
  dateFrom?: string | null
  dateTo?:   string | null
} = {}) {
  const userId   = useAuthStore((s) => s.user?.id ?? null)
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null)

  // Default to caller's own ID so a teller always sees their own data
  const effectiveTellerId = opts.tellerId ?? userId

  return useQuery({
    queryKey:       [TELLER_SUM_KEY, effectiveTellerId, opts.dateFrom, opts.dateTo, branchId],
    queryFn:        () => dashboardService.getTellerSummary({
      tellerId: effectiveTellerId,
      dateFrom: opts.dateFrom ?? null,
      dateTo:   opts.dateTo   ?? null,
      branchId,
    }),
    staleTime:       REFETCH_MS,
    refetchInterval: REFETCH_MS,
    enabled: !!effectiveTellerId,
  })
}
