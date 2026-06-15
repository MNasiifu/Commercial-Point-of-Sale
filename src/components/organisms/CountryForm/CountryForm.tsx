import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { countrySchema, type CountryFormValues } from '@/lib/zod-schemas/catalog.schemas'
import { useCreateCountry, useUpdateCountry } from '@/hooks/countries/useCountryMutations'
import type { Country } from '@/types/database.types'

interface Props {
  open: boolean
  onClose: () => void
  existing?: Country
}

export function CountryForm({ open, onClose, existing }: Props) {
  const createCountry = useCreateCountry()
  const updateCountry = useUpdateCountry()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CountryFormValues>({
    resolver: zodResolver(countrySchema),
    defaultValues: existing
      ? { name: existing.name, code: existing.code ?? '' }
      : { name: '', code: '' },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: CountryFormValues) => {
    const code = values.code?.trim() ? values.code.trim().toUpperCase() : null
    const payload = { name: values.name, code }
    if (existing) {
      await updateCountry.mutateAsync({ id: existing.id, data: payload })
    } else {
      await createCountry.mutateAsync(payload)
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{existing ? 'Edit country' : 'Add country'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name *"
                size="small"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="ISO code (optional)"
                size="small"
                fullWidth
                margin="normal"
                placeholder="UG"
                inputProps={{ maxLength: 2, style: { textTransform: 'uppercase' } }}
                error={!!errors.code}
                helperText={errors.code?.message ?? 'Two-letter ISO 3166-1 alpha-2'}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {existing ? 'Save changes' : 'Create country'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
