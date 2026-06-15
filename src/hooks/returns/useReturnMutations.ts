import { useMutation, useQueryClient } from '@tanstack/react-query'
import { returnService, type ProcessReturnPayload } from '@/services/returnService'
import { notify } from '@/store/notificationStore'
import { RETURNS_KEY } from './useReturns'

export function useProcessReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProcessReturnPayload) => returnService.processReturn(payload),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [RETURNS_KEY] })
      notify.success(`Return ${result.return_number} processed`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
