import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  reconciliationService,
  type CloseReconciliationPayload,
} from '@/services/reconciliationService'
import { useAuthStore } from '@/store/authStore'
import { notify }      from '@/store/notificationStore'

const RECON_KEY = 'reconciliations'

export function useReconciliations() {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null)
  return useQuery({
    queryKey:  [RECON_KEY, branchId],
    queryFn:   () => reconciliationService.getAll(branchId),
    staleTime: 30_000,
  })
}

export function useReconciliation(id: string | undefined) {
  return useQuery({
    queryKey:  [RECON_KEY, id],
    queryFn:   () => reconciliationService.getById(id!),
    enabled:   !!id,
    staleTime: 30_000,
  })
}

export function useReconciliationPreview(date: string, enabled: boolean) {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? null)
  return useQuery({
    queryKey:  ['recon-preview', date, branchId],
    queryFn:   () => reconciliationService.getPreview(date, branchId),
    enabled:   enabled && !!date,
    staleTime: 30_000,
  })
}

export function useCloseReconciliation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CloseReconciliationPayload) =>
      reconciliationService.close(payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [RECON_KEY] })
      qc.invalidateQueries({ queryKey: ['recon-preview'] })
      const sign = result.total_variance >= 0 ? '+' : ''
      notify.success(
        `Reconciliation submitted. Variance: ${sign}UGX ${result.total_variance.toLocaleString()}`,
      )
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
