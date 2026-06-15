import { useQuery } from '@tanstack/react-query'
import { returnService, type ReturnFilters } from '@/services/returnService'

export const RETURNS_KEY = 'returns'

export function useReturns(filters: ReturnFilters = {}) {
  return useQuery({
    queryKey:  [RETURNS_KEY, filters],
    queryFn:   () => returnService.getAll(filters),
    staleTime: 30_000,
  })
}

export function useReturn(id: string | undefined) {
  return useQuery({
    queryKey:  [RETURNS_KEY, id],
    queryFn:   () => returnService.getById(id!),
    enabled:   !!id,
    staleTime: 30_000,
  })
}
