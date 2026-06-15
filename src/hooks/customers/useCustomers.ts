import { useQuery } from '@tanstack/react-query'
import { customerService, type CustomerFilters } from '@/services/customerService'

export const CUSTOMERS_KEY = 'customers'

export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, filters],
    queryFn:  () => customerService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, id],
    queryFn:  () => customerService.getById(id!),
    enabled:  !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, 'search', query],
    queryFn:  () => customerService.search(query),
    enabled:  query.trim().length >= 2,
    staleTime: 30 * 1000,
  })
}
