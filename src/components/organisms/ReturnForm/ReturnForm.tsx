import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, Box, Button, Checkbox, CircularProgress, Divider,
  FormControl, FormControlLabel, FormHelperText, InputLabel,
  MenuItem, Radio, RadioGroup, Select, Stack, TextField,
  Tooltip, Typography,
} from '@mui/material'
import UndoIcon from '@mui/icons-material/Undo'

import {
  processReturnSchema,
  type ProcessReturnFormValues,
} from '@/lib/zod-schemas/return.schemas'
import { useProcessReturn }  from '@/hooks/returns/useReturnMutations'
import { useAuthStore }      from '@/store/authStore'
import { formatUGX }         from '@/lib/formatters'
import type { SaleWithDetails } from '@/services/salesService'

interface Props {
  sale:     SaleWithDetails
  onDone:   (returnId: string) => void
  onCancel: () => void
}

export function ReturnForm({ sale, onDone, onCancel }: Props) {
  const processReturn = useProcessReturn()
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? '')

  const defaultLines = sale.sale_items.map((item) => ({
    sale_item_id:      item.id,
    product_id:        item.product_id,
    quantity_returned: 1,
    max_quantity:      item.quantity,
    unit_price:        item.unit_price,
    refund_amount:     item.unit_price,
    product_name:      item.products?.name ?? '—',
    sub:               [item.products?.sizes?.name, item.products?.colors?.name].filter(Boolean).join(' · '),
    selected:          false,
  }))

  const { control, register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<ProcessReturnFormValues>({
      resolver: zodResolver(processReturnSchema),
      defaultValues: {
        sale_id:       sale.id,
        branch_id:     branchId,
        customer_id:   sale.customer_id,
        reason:        '',
        return_type:   'restock',
        refund_method: 'cash',
        notes:         null,
        lines:         defaultLines,
      },
    })

  const lines = watch('lines')

  // Recompute refund_amount when quantity_returned changes
  useEffect(() => {
    lines.forEach((line, i) => {
      const refund = line.quantity_returned * line.unit_price
      if (refund !== line.refund_amount) {
        setValue(`lines.${i}.refund_amount`, refund)
      }
    })
  }, [lines, setValue])

  const selectedLines  = lines.filter((l) => l.selected)
  const totalRefund    = selectedLines.reduce((s, l) => s + l.refund_amount, 0)

  const linesError = (errors.lines as { message?: string } | undefined)?.message

  const onSubmit = async (values: ProcessReturnFormValues) => {
    const items = values.lines
      .filter((l) => l.selected)
      .map((l) => ({
        sale_item_id:      l.sale_item_id,
        product_id:        l.product_id,
        quantity_returned: l.quantity_returned,
        refund_amount:     l.refund_amount,
      }))

    const result = await processReturn.mutateAsync({
      branch_id:     values.branch_id,
      sale_id:       values.sale_id,
      customer_id:   values.customer_id,
      reason:        values.reason,
      return_type:   values.return_type,
      refund_method: values.refund_method,
      notes:         values.notes,
      items,
    })

    onDone(result.return_id)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box mb={2}>
        <Typography variant="subtitle2" color="text.secondary">
          Sale:{' '}
          <strong style={{ fontFamily: 'monospace' }}>{sale.sale_number}</strong>
          {sale.customers && ` · ${sale.customers.full_name}`}
        </Typography>
      </Box>

      {/* Item selection table */}
      <Typography variant="subtitle2" fontWeight={700} mb={1}>
        Select items to return
      </Typography>

      <Box
        border="1px solid"
        borderColor="divider"
        borderRadius={1}
        overflow="hidden"
        mb={2}
      >
        {lines.map((line, i) => (
          <Box
            key={line.sale_item_id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 130px 110px',
              alignItems: 'center',
              px: 1.5,
              py: 1,
              borderBottom: i < lines.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              bgcolor: line.selected ? 'action.selected' : 'transparent',
            }}
          >
            {/* Checkbox */}
            <Controller
              name={`lines.${i}.selected`}
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                  size="small"
                  sx={{ p: 0.5 }}
                />
              )}
            />

            {/* Product name */}
            <Box>
              <Typography variant="body2" fontWeight={600} noWrap>
                {line.product_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {line.sub ? `${line.sub} · ` : ''}{formatUGX(line.unit_price)} each · max {line.max_quantity}
              </Typography>
            </Box>

            {/* Quantity input */}
            <Box px={1}>
              <Tooltip
                title={!line.selected ? 'Check the item first' : ''}
                arrow
                disableHoverListener={line.selected}
              >
                <TextField
                  {...register(`lines.${i}.quantity_returned`, { valueAsNumber: true })}
                  type="number"
                  size="small"
                  disabled={!line.selected}
                  inputProps={{ min: 1, max: line.max_quantity, style: { textAlign: 'center' } }}
                  sx={{ width: 80 }}
                  error={!!(errors.lines as Record<number, { quantity_returned?: { message?: string } }> | undefined)?.[i]?.quantity_returned}
                />
              </Tooltip>
            </Box>

            {/* Refund amount */}
            <Box textAlign="right" pr={0.5}>
              <Typography
                variant="body2"
                fontFamily="monospace"
                color={line.selected ? 'text.primary' : 'text.disabled'}
              >
                {formatUGX(line.refund_amount)}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {linesError && (
        <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
          {linesError}
        </Alert>
      )}

      <Box
        display="flex"
        justifyContent="flex-end"
        mb={2.5}
        px={1}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Total refund: {formatUGX(totalRefund)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Return type */}
      <Box mb={2}>
        <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
          Return type
        </Typography>
        <Controller
          name="return_type"
          control={control}
          render={({ field }) => (
            <RadioGroup row {...field}>
              <FormControlLabel
                value="restock"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Restock</Typography>
                    <Typography variant="caption" color="text.secondary">Items returned to stock</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="writeoff"
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Write-off</Typography>
                    <Typography variant="caption" color="text.secondary">Items damaged/unsellable</Typography>
                  </Box>
                }
              />
            </RadioGroup>
          )}
        />
      </Box>

      {/* Refund method */}
      <Box mb={2}>
        <Controller
          name="refund_method"
          control={control}
          render={({ field }) => (
            <FormControl size="small" fullWidth error={!!errors.refund_method}>
              <InputLabel>Refund method</InputLabel>
              <Select
                {...field}
                value={field.value ?? ''}
                label="Refund method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="mtn_momo">MTN MoMo</MenuItem>
                <MenuItem value="airtel_money">Airtel Money</MenuItem>
              </Select>
              {errors.refund_method && (
                <FormHelperText>{errors.refund_method.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Box>

      {/* Reason */}
      <Box mb={2}>
        <TextField
          {...register('reason')}
          label="Reason for return"
          multiline
          minRows={2}
          fullWidth
          size="small"
          error={!!errors.reason}
          helperText={errors.reason?.message}
          placeholder="e.g. Wrong product dispensed, customer reaction…"
        />
      </Box>

      {/* Optional notes */}
      <Box mb={3}>
        <TextField
          {...register('notes')}
          label="Internal notes (optional)"
          multiline
          minRows={1}
          fullWidth
          size="small"
        />
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end">
        <Button onClick={onCancel} disabled={processReturn.isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={processReturn.isPending || selectedLines.length === 0}
          startIcon={
            processReturn.isPending
              ? <CircularProgress size={16} color="inherit" />
              : <UndoIcon />
          }
        >
          Process return
        </Button>
      </Stack>
    </form>
  )
}

