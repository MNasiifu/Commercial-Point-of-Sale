import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deliveryService, type CreateDeliveryPayload } from '@/services/deliveryService'
import { notify } from '@/store/notificationStore'
import { DELIVERIES_KEY } from './useDeliveries'
import type { DeliveryStatus } from '@/types/database.types'

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [DELIVERIES_KEY] })
}

export function useCreateDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDeliveryPayload) => deliveryService.create(payload),
    onSuccess: (d) => {
      invalidate(qc)
      notify.success(`Delivery order ${d.order_number} created`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useUpdateDeliveryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) =>
      deliveryService.updateStatus(id, status),
    onSuccess: (_, { status }) => {
      invalidate(qc)
      notify.success(`Status updated to ${status.replace('_', ' ')}`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useCancelDelivery() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deliveryService.cancel(id),
    onSuccess: () => { invalidate(qc); notify.success('Delivery order cancelled') },
    onError: (e: Error) => notify.error(e.message),
  })
}
