import { useQuery } from '@tanstack/react-query'
import { userService, type UserFilters } from '@/services/userService'

export const USERS_KEY = 'users'

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey:  [USERS_KEY, filters],
    queryFn:   () => userService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  })
}

export function useBranches() {
  return useQuery({
    queryKey:  ['branches'],
    queryFn:   () => userService.getBranches(),
    staleTime: 10 * 60 * 1000,
  })
}
