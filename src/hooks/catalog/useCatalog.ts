import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notify } from '@/store/notificationStore'
import {
  brandService, colorService, garmentTypeService, sizeService,
  type CatalogFilters, type CatalogBase, type CatalogService,
} from '@/services/catalogService'

/** Build the standard list + CRUD hooks for one catalog entity. */
function makeCatalogHooks<T extends CatalogBase>(
  key: string,
  label: string,
  service: CatalogService<T>,
) {
  const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
    qc.invalidateQueries({ queryKey: [key] })
  }

  const useList = (filters: CatalogFilters = {}) =>
    useQuery({
      queryKey: [key, filters],
      queryFn: () => service.getAll(filters),
      staleTime: 2 * 60 * 1000,
    })

  const useCreate = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (data: Partial<T>) => service.create(data),
      onSuccess: (r) => { invalidate(qc); notify.success(`${label} "${r.name}" created`) },
      onError: (e: Error) => notify.error(e.message),
    })
  }

  const useUpdate = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<T> }) => service.update(id, data),
      onSuccess: (r) => { invalidate(qc); notify.success(`${label} "${r.name}" updated`) },
      onError: (e: Error) => notify.error(e.message),
    })
  }

  const useDeactivate = () => {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => service.deactivate(id),
      onSuccess: () => { invalidate(qc); notify.success(`${label} deactivated`) },
      onError: (e: Error) => notify.error(e.message),
    })
  }

  return { useList, useCreate, useUpdate, useDeactivate }
}

export const brandHooks       = makeCatalogHooks('brands', 'Brand', brandService)
export const colorHooks       = makeCatalogHooks('colors', 'Color', colorService)
export const garmentTypeHooks = makeCatalogHooks('garment_types', 'Garment type', garmentTypeService)
export const sizeHooks        = makeCatalogHooks('sizes', 'Size', sizeService)
