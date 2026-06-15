import { useQuery } from '@tanstack/react-query'
import { productService } from '@/services/productService'

// ─── Catalog dropdowns used by the product form & filters ─────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn:  productService.getCategories,
    staleTime: 1000 * 60 * 10,
  })
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn:  productService.getBrands,
    staleTime: 1000 * 60 * 10,
  })
}

export function useColors() {
  return useQuery({
    queryKey: ['colors'],
    queryFn:  productService.getColors,
    staleTime: 1000 * 60 * 10,
  })
}

export function useGarmentTypes() {
  return useQuery({
    queryKey: ['garment_types'],
    queryFn:  productService.getGarmentTypes,
    staleTime: 1000 * 60 * 10,
  })
}

export function useSizes() {
  return useQuery({
    queryKey: ['sizes'],
    queryFn:  productService.getSizes,
    staleTime: 1000 * 60 * 10,
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn:  productService.getCountries,
    staleTime: 1000 * 60 * 60, // 1 hour — rarely changes
  })
}

// ─── Transitional stubs ───────────────────────────────────────
// Manufacturers & Suppliers were removed in the garment revamp. These
// no-op hooks keep not-yet-migrated inventory screens compiling until
// they are reworked in Phase 4. Remove once those screens are updated.
export function useManufacturers() {
  return useQuery({ queryKey: ['manufacturers'], queryFn: async () => [], staleTime: Infinity })
}

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: async () => [], staleTime: Infinity })
}
