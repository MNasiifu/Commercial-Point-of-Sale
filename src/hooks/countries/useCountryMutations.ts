import { useMutation, useQueryClient } from '@tanstack/react-query'
import { countryService } from '@/services/countryService'
import { notify } from '@/store/notificationStore'
import { COUNTRIES_KEY } from './useCountries'

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [COUNTRIES_KEY] })
  qc.invalidateQueries({ queryKey: ['countries'] })
}

export function useCreateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; code?: string | null }) =>
      countryService.create(data),
    onSuccess: (c) => {
      invalidate(qc)
      notify.success(`Country "${c.name}" created`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useUpdateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { name: string; code?: string | null }
    }) => countryService.update(id, data),
    onSuccess: (c) => {
      invalidate(qc)
      notify.success(`Country "${c.name}" updated`)
    },
    onError: (e: Error) => notify.error(e.message),
  })
}

export function useDeactivateCountry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => countryService.deactivate(id),
    onSuccess: () => {
      invalidate(qc)
      notify.success('Country deactivated')
    },
    onError: (e: Error) => notify.error(e.message),
  })
}
