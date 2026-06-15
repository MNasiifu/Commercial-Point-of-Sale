import { useState } from 'react'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControl, Grid, IconButton, InputLabel,
  MenuItem, Select, Stack, TextField, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver }                         from '@hookform/resolvers/zod'

import { deliveryOrderSchema, type DeliveryOrderFormValues } from '@/lib/zod-schemas/customer.schemas'
import { CustomerSearchAutocomplete } from '@/components/molecules/CustomerSearchAutocomplete/CustomerSearchAutocomplete'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import { DeleteConfirmationModal } from '@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal'
import { useCreateDelivery }          from '@/hooks/deliveries/useDeliveryMutations'
import { useAuthStore }               from '@/store/authStore'
import { useProductSearch }           from '@/hooks/pos/useProductSearch'
import { formatUGX }                  from '@/lib/formatters'
import type { Customer }              from '@/types/database.types'

interface Props {
  open:    boolean
  onClose: () => void
}

function ProductItemSearch({ onAdd }: { onAdd: (item: DeliveryOrderFormValues['items'][number]) => void }) {
  const [query, setQuery] = useState('')
  const { data: results = [] } = useProductSearch(query)

  return (
    <Box>
      <SearchTextField
        placeholder="Search product to add…"
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 && query.length >= 2 && (
        <Box
          border="1px solid"
          borderColor="divider"
          borderRadius={1}
          mt={0.5}
          maxHeight={200}
          overflow="auto"
          bgcolor="background.paper"
          zIndex={10}
          position="relative"
        >
          {results.map((r) => {
            const sub = [r.brand_name, r.size_name, r.color_name].filter(Boolean).join(' · ')
            return (
              <Box
                key={r.product_id}
                px={1.5}
                py={1}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                onClick={() => {
                  onAdd({
                    product_id:   r.product_id,
                    product_name: r.product_name,
                    sub,
                    quantity:     1,
                    unit_price:   r.retail_price,
                    line_total:   r.retail_price,
                  })
                  setQuery('')
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>{r.product_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {sub ? `${sub} · ` : ''}Stock: {r.stock_available}
                  </Typography>
                </Box>
                <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                  {formatUGX(r.retail_price)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

export function DeliveryForm({ open, onClose }: Props) {
  const createDelivery = useCreateDelivery()
  const profile   = useAuthStore((s) => s.profile)
  const branchId  = profile?.branch_id ?? ''
  const tellerId  = useAuthStore((s) => s.user?.id) ?? ''
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const {
    control, handleSubmit, setValue, watch,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<DeliveryOrderFormValues>({
    resolver: zodResolver(deliveryOrderSchema),
    defaultValues: {
      customer_id:      null,
      customer_name:    '',
      customer_phone:   null,
      order_source:     'phone',
      delivery_address: null,
      delivery_notes:   null,
      items:            [],
    },
  })

  const { fields: itemFields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')
  const grandTotal = items.reduce((s, i) => s + (parseFloat(String(i.quantity)) * i.unit_price), 0)

  const handleClose = () => { reset(); onClose() }

  const handleCustomerChange = (customer: Customer | null) => {
    if (customer) {
      setValue('customer_id',    customer.id)
      setValue('customer_name',  customer.full_name)
      setValue('customer_phone', customer.phone ?? null)
    } else {
      setValue('customer_id',    null)
      setValue('customer_name',  '')
      setValue('customer_phone', null)
    }
  }

  const onSubmit = async (values: DeliveryOrderFormValues) => {
    await createDelivery.mutateAsync({
      ...values,
      customer_id:      values.customer_id      ?? null,
      customer_phone:   values.customer_phone   ?? null,
      delivery_address: values.delivery_address ?? null,
      delivery_notes:   values.delivery_notes   ?? null,
      branch_id: branchId,
      teller_id: tellerId,
      items:     values.items.map((i) => ({
        ...i,
        quantity:  Number(i.quantity),
        line_total: Number(i.quantity) * i.unit_price,
      })),
    })
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>New delivery order</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} mt={0.5}>
          {/* Customer */}
          <Grid item xs={12} md={6}>
            <CustomerSearchAutocomplete
              onChange={handleCustomerChange}
              label="Existing customer (optional)"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="customer_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Customer name *"
                  size="small"
                  fullWidth
                  error={!!errors.customer_name}
                  helperText={errors.customer_name?.message ?? 'Fill manually if not in system'}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="customer_phone"
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

          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="order_source"
              control={control}
              render={({ field }) => (
                <FormControl size="small" fullWidth>
                  <InputLabel>Order source</InputLabel>
                  <Select {...field} label="Order source">
                    <MenuItem value="phone">Phone call</MenuItem>
                    <MenuItem value="whatsapp">WhatsApp</MenuItem>
                    <MenuItem value="walk_in">Walk-in</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Controller
              name="delivery_address"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Delivery address"
                  size="small"
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="delivery_notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label="Notes / special instructions"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                />
              )}
            />
          </Grid>

          {/* Items */}
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Order items
            </Typography>

            <ProductItemSearch
              onAdd={(item) => {
                const existing = itemFields.findIndex(
                  (f) => f.product_id === item.product_id
                )
                if (existing >= 0) {
                  const cur = items[existing]
                  setValue(`items.${existing}.quantity`, Number(cur.quantity) + 1)
                  setValue(`items.${existing}.line_total`, (Number(cur.quantity) + 1) * item.unit_price)
                } else {
                  append(item)
                }
              }}
            />

            {errors.items && (
              <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>
                {(errors.items as { message?: string })?.message ?? 'Please add at least one item'}
              </Alert>
            )}

            {itemFields.length > 0 && (
              <Stack spacing={1} mt={1.5}>
                {itemFields.map((field, i) => (
                  <Box
                    key={field.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    p={1}
                    border="1px solid"
                    borderColor="divider"
                    borderRadius={1}
                  >
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>{field.product_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{field.sub}</Typography>
                    </Box>
                    <Controller
                      name={`items.${i}.quantity`}
                      control={control}
                      render={({ field: f }) => (
                        <TextField
                          {...f}
                          type="number"
                          size="small"
                          label="Qty"
                          inputProps={{ min: 1 }}
                          sx={{ width: 80 }}
                          onChange={(e) => {
                            const qty = parseFloat(e.target.value) || 1
                            f.onChange(qty)
                            setValue(`items.${i}.line_total`, qty * items[i].unit_price)
                          }}
                        />
                      )}
                    />
                    <Typography variant="body2" fontFamily="monospace" fontWeight={600} minWidth={90} textAlign="right">
                      {formatUGX(items[i]?.quantity ? Number(items[i].quantity) * items[i].unit_price : field.unit_price)}
                    </Typography>
                    <IconButton size="small" color="error" onClick={() => setDeleteConfirm(i)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Box display="flex" justifyContent="flex-end" pt={0.5}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Total: {formatUGX(grandTotal)}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        open={deleteConfirm !== null}
        title="Remove item from delivery?"
        itemName={deleteConfirm !== null ? `${items[deleteConfirm]?.product_name}` : ''}
        description="You are about to remove"
        warningMessage="This item will be removed from the delivery order."
        isPending={false}
        onConfirm={() => {
          if (deleteConfirm !== null) {
            remove(deleteConfirm)
            setDeleteConfirm(null)
          }
        }}
        onClose={() => setDeleteConfirm(null)}
        confirmButtonText="Remove"
      />

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create delivery order'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
