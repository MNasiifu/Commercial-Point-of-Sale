import { useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProduct, useDeleteProduct } from './useProducts'
import { useToggleProductActive } from './useProductMutations'
import type { ProductWithDetails } from '@/services/productService'

// ─── Modal state shape ───────────────────────────────────────────
type ModalState =
  | { kind: 'none' }
  | { kind: 'delete'; product: ProductWithDetails }
  | { kind: 'toggle'; product: ProductWithDetails }

export function useProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: product, isLoading, isError } = useProduct(id)
  const toggleActive = useToggleProductActive()
  const deleteProduct = useDeleteProduct()

  const [modal, setModal] = useState<ModalState>({ kind: 'none' })

  // ── Navigation ──────────────────────────────────────────────────
  const goBack = useCallback(() => navigate(-1), [navigate]);
  const goEdit = useCallback(
    () => navigate(`/products/${id}/edit`),
    [navigate, id],
  )

  // ── Modal open handlers ─────────────────────────────────────────
  const handleRequestToggle = useCallback(
    (p: ProductWithDetails) => setModal({ kind: 'toggle', product: p }),
    [],
  )

  const handleRequestDelete = useCallback(
    (p: ProductWithDetails) => setModal({ kind: 'delete', product: p }),
    [],
  )

  // ── Close — only allowed when no mutation is in flight ──────────
  const handleClose = useCallback(() => {
    if (toggleActive.isPending || deleteProduct.isPending) return
    setModal({ kind: 'none' })
  }, [toggleActive.isPending, deleteProduct.isPending])

  // ── Confirmed delete ────────────────────────────────────────────
  const handleConfirmDelete = useCallback(() => {
    if (modal.kind !== 'delete') return
    deleteProduct.mutate(modal.product.id, {
      onSettled: () => {
        setModal({ kind: 'none' })
        navigate('/products')
      },
    })
  }, [modal, deleteProduct, navigate])

  // ── Confirmed toggle ────────────────────────────────────────────
  const handleConfirmToggle = useCallback(() => {
    if (modal.kind !== 'toggle') return
    const { product: p } = modal
    toggleActive.mutate(
      { id: p.id, isActive: !p.is_active },
      { onSettled: () => setModal({ kind: 'none' }) },
    )
  }, [modal, toggleActive])

  return {
    id,
    product,
    isLoading,
    isError,
    modal,
    toggleActive,
    deleteProduct,
    goBack,
    goEdit,
    handleRequestToggle,
    handleRequestDelete,
    handleClose,
    handleConfirmDelete,
    handleConfirmToggle,
  }
}
