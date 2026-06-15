import { useQuery } from '@tanstack/react-query'
import { countryService, type CountryFilters } from '@/services/countryService'

export const COUNTRIES_KEY = 'countries'

export function useCountriesList(filters: CountryFilters = {}) {
  return useQuery({
    queryKey: [COUNTRIES_KEY, 'list', filters],
    queryFn: () => countryService.getAll(filters),
    staleTime: 2 * 60 * 1000,
  })
}
