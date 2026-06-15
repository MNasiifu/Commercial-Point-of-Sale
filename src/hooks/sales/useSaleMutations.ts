import { useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService } from '@/services/salesService'
import { notify } from '@/store/notificationStore'
import { SALES_KEY } from './useSales'

export function useVoidSale() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ saleId, reason }: { saleId: string; reason: string }) =>
      salesService.voidSale(saleId, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SALES_KEY] })
      notify.success('Sale voided successfully')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
