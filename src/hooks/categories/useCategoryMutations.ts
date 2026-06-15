import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService } from '@/services/categoryService'
import { notify } from '@/store/notificationStore'
import { CATEGORIES_KEY } from './useCategories'

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] })
  qc.invalidateQueries({ queryKey: ['categories'] })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description?: string | null }) =>
      categoryService.create(data),
    onSuccess: (c) => {
      invalidate(qc)
      notify.success(`Category "${c.name}" created`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name: string; description?: string | null }
    }) => categoryService.update(id, data),
    onSuccess: (c) => {
      invalidate(qc)
      notify.success(`Category "${c.name}" updated`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useDeactivateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoryService.deactivate(id),
    onSuccess: () => {
      invalidate(qc)
      notify.success('Category deactivated')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
