import { useQuery } from '@tanstack/react-query'
import { deliveryService, type DeliveryFilters } from '@/services/deliveryService'

export const DELIVERIES_KEY = 'delivery-orders'

export function useDeliveries(filters: DeliveryFilters = {}) {
  return useQuery({
    queryKey: [DELIVERIES_KEY, filters],
    queryFn:  () => deliveryService.getAll(filters),
    staleTime: 60 * 1000,
  })
}

export function useDelivery(id: string | undefined) {
  return useQuery({
    queryKey: [DELIVERIES_KEY, id],
    queryFn:  () => deliveryService.getById(id!),
    enabled:  !!id,
    staleTime: 30 * 1000,
  })
}
