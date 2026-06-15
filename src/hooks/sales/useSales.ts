import { useQuery } from '@tanstack/react-query'
import { salesService, type SaleFilters } from '@/services/salesService'

export const SALES_KEY = 'sales'

export function useSales(filters: SaleFilters = {}) {
  return useQuery({
    queryKey:  [SALES_KEY, filters],
    queryFn:   () => salesService.getAll(filters),
    staleTime: 30_000,
  })
}

export function useSale(id: string | undefined) {
  return useQuery({
    queryKey:  [SALES_KEY, id],
    queryFn:   () => salesService.getById(id!),
    enabled:   !!id,
    staleTime: 30_000,
  })
}
