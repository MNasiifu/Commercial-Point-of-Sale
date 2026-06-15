import { useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '@/services/productService'
import { notify } from '@/store/notificationStore'
import { PRODUCTS_KEY } from './useProducts'
import type { Product } from '@/types/database.types'

type CreateProductInput = Parameters<typeof productService.create>

function invalidateProducts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
}

// ─── Product CRUD ─────────────────────────────────────────────
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: CreateProductInput) => productService.create(...args),
    onSuccess: (data) => {
      invalidateProducts(qc)
      notify.success(`Product "${data.name}" created successfully`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Product, 'id' | 'created_at'>> }) =>
      productService.update(id, data),
    onSuccess: (data) => {
      invalidateProducts(qc)
      notify.success(`Product "${data.name}" updated`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useToggleProductActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productService.toggleActive(id, isActive),
    onSuccess: (_, { isActive }) => {
      invalidateProducts(qc)
      notify.success(isActive ? 'Product activated' : 'Product deactivated')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productService.softDelete(id),
    onSuccess: () => {
      invalidateProducts(qc)
      notify.success('Product deleted')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

// ─── Barcodes ─────────────────────────────────────────────────
export function useAddBarcode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, barcode, isGenerated }: {
      productId: string; barcode: string; isGenerated: boolean
    }) => productService.addBarcode(productId, barcode, isGenerated),
    onSuccess: () => {
      invalidateProducts(qc)
      notify.success('Barcode added')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useDeleteBarcode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (barcodeId: string) => productService.deleteBarcode(barcodeId),
    onSuccess: () => {
      invalidateProducts(qc)
      notify.success('Barcode removed')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
