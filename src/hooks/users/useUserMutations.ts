import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService, type CreateUserPayload, type CreateUserResult } from '@/services/userService'
import { notify } from '@/store/notificationStore'
import { USERS_KEY } from './useUsers'
import type { Profile } from '@/types/database.types'

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [USERS_KEY] })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation<CreateUserResult, Error, CreateUserPayload>({
    mutationFn: (payload) => userService.createUser(payload),
    onSuccess: (result, vars) => {
      invalidate(qc)
      notify.success(`User "${vars.full_name}" created successfully`)
      return result
    },
    onError: (e) => notify.error(e.message),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation<
    Profile,
    Error,
    { id: string; data: Partial<Pick<Profile, 'full_name' | 'role' | 'branch_id'>> }
  >({
    mutationFn: ({ id, data }) => userService.update(id, data),
    onSuccess: (u) => {
      invalidate(qc)
      notify.success(`User "${u.full_name}" updated`)
    },
    onError: (e) => notify.error(e.message),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; email: string }>({
    mutationFn: ({ id, email }) => userService.deleteUser(id, email),
    onSuccess: () => {
      invalidate(qc)
      notify.success('Account removed successfully')
    },
    onError: (e) => notify.error(e.message),
  })
}

export function useToggleUserActive() {
  const qc = useQueryClient()
  return useMutation<void, Error, { id: string; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => userService.toggleActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      invalidate(qc)
      notify.success(isActive ? 'User activated' : 'User deactivated')
    },
    onError: (e) => notify.error(e.message),
  })
}
