import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerService } from '@/services/customerService'
import { notify } from '@/store/notificationStore'
import { CUSTOMERS_KEY } from './useCustomers'
import type { Customer } from '@/types/database.types'

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'is_active' | 'created_at' | 'updated_at' | 'deleted_at'>) =>
      customerService.create(data),
    onSuccess: (c) => { invalidate(qc); notify.success(`Customer "${c.full_name}" created`) },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Customer, 'id'>> }) =>
      customerService.update(id, data),
    onSuccess: (c) => { invalidate(qc); notify.success(`Customer "${c.full_name}" updated`) },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => customerService.softDelete(id),
    onSuccess: () => { invalidate(qc); notify.success('Customer removed') },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useToggleCustomerActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      customerService.toggleActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      invalidate(qc)
      notify.success(isActive ? 'Customer activated' : 'Customer deactivated')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
