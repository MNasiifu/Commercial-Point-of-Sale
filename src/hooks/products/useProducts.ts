import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService, type ProductFilters } from '@/services/productService'
import { notify } from '@/store/notificationStore'

export const PRODUCTS_KEY = 'products'

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, filters],
    queryFn:  () => productService.getAll(filters),
    staleTime: 1000 * 60 * 2,
  })
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn:  () => productService.getById(id!),
    enabled:  !!id,
    staleTime: 1000 * 60 * 2,
  })
}

/** Soft-delete a product (sets deleted_at + is_active=false via productService.softDelete). */
export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productService.softDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
      notify.success('Product deleted successfully')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
