import { useQuery } from '@tanstack/react-query'
import { categoryService, type CategoryFilters } from '@/services/categoryService'

export const CATEGORIES_KEY = 'categories'

export function useCategories(filters: CategoryFilters = {}) {
  return useQuery({
    queryKey: [CATEGORIES_KEY, filters],
    queryFn: () => categoryService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  })
}
