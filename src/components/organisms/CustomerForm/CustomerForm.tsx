import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, Grid, InputLabel, MenuItem, Select, TextField,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'

import { customerSchema, type CustomerFormValues } from '@/lib/zod-schemas/customer.schemas'
import { useCreateCustomer, useUpdateCustomer }    from '@/hooks/customers/useCustomerMutations'
import type { Customer } from '@/types/database.types'

interface Props {
  open:      boolean
  onClose:   () => void
  existing?: Customer
  onCreated?: (customer: Customer) => void
}

export function CustomerForm({ open, onClose, existing, onCreated }: Props) {
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const {
    control, handleSubmit, reset,
    formState: { isSubmitting, errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: existing
      ? {
          full_name:     existing.full_name,
          phone:         existing.phone,
          email:         existing.email,
          address:       existing.address,
          customer_type: existing.customer_type,
          notes:         existing.notes,
        }
      : { full_name: '', phone: null, email: null, address: null, customer_type: 'account', notes: null },
  })

  const handleClose = () => { reset(); onClose() }

  const onSubmit = async (values: CustomerFormValues) => {
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
    }
    if (existing) {
      await updateCustomer.mutateAsync({ id: existing.id, data: payload })
    } else {
      const created = await createCustomer.mutateAsync(payload as Parameters<typeof createCustomer.mutateAsync>[0])
      onCreated?.(created)
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{existing ? 'Edit customer' : 'Add customer'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0.5}>
          <Grid item xs={12}>
            <Controller
              name="full_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full name *"
                  size="small"
                  fullWidth
                  error={!!errors.full_name}
                  helperText={errors.full_name?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Phone number"
                  size="small"
                  fullWidth
                  placeholder="+256 7XX XXX XXX"
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Email address"
                  size="small"
                  fullWidth
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="customer_type"
              control={control}
              render={({ field }) => (
                <FormControl size="small" fullWidth>
                  <InputLabel>Customer type</InputLabel>
                  <Select {...field} label="Customer type">
                    <MenuItem value="walk_in">Walk-in</MenuItem>
                    <MenuItem value="account">Account</MenuItem>
                    <MenuItem value="delivery">Delivery</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Address"
                  size="small"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Notes"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {existing ? 'Save changes' : 'Add customer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
