import { useEffect, useMemo } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert, Box, Button, CircularProgress, Divider,
  Grid, InputAdornment, Paper, Skeleton, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import {
  reconciliationSchema,
  type ReconciliationFormValues,
} from '@/lib/zod-schemas/reconciliation.schemas'
import {
  useReconciliationPreview,
  useCloseReconciliation,
} from '@/hooks/reconciliation/useReconciliation'
import { useAuthStore }   from '@/store/authStore'
import { formatUGX }      from '@/lib/formatters'

// Uganda currency denominations (notes + coins)
const DENOMINATIONS = [
  { value: 50_000, label: '50,000' },
  { value: 20_000, label: '20,000' },
  { value: 10_000, label: '10,000' },
  { value:  5_000, label: '5,000'  },
  { value:  2_000, label: '2,000'  },
  { value:  1_000, label: '1,000'  },
  { value:    500, label: '500'    },
  { value:    200, label: '200'    },
  { value:    100, label: '100'    },
  { value:     50, label: '50'     },
]

interface Props {
  date:    string
  onDone:  (id: string) => void
}

export function ReconciliationForm({ date, onDone }: Props) {
  const branchId = useAuthStore((s) => s.profile?.branch_id ?? '')
  const submit   = useCloseReconciliation()

  const { data: preview, isLoading: previewLoading } =
    useReconciliationPreview(date, !!date)

  const defaultDenominations = DENOMINATIONS.map((d) => ({
    denomination: d.value,
    label:        d.label,
    count:        0,
  }))

  const { control, register, handleSubmit, reset, formState: { errors } } =
    useForm<ReconciliationFormValues>({
      resolver: zodResolver(reconciliationSchema),
      defaultValues: {
        branch_id:           branchId,
        reconciliation_date: date,
        actual_mtn_momo:     0,
        actual_airtel_money: 0,
        notes:               null,
        denominations:       defaultDenominations,
      },
    })

  // Populate actuals from existing record if re-opening
  useEffect(() => {
    if (!preview) return
    reset({
      branch_id:           branchId,
      reconciliation_date: date,
      actual_mtn_momo:     preview.existing_actual_mtn_momo  ?? 0,
      actual_airtel_money: preview.existing_actual_airtel    ?? 0,
      notes:               preview.existing_notes            ?? null,
      denominations:       defaultDenominations,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview?.existing_id])

  // Watch denominations to derive actual_cash
  const denominations = useWatch({ control, name: 'denominations' })
  const actualCash = useMemo(
    () => denominations.reduce((s, d) => s + d.denomination * d.count, 0),
    [denominations],
  )

  const actualMtn    = useWatch({ control, name: 'actual_mtn_momo' })
  const actualAirtel = useWatch({ control, name: 'actual_airtel_money' })
  const totalActual  = actualCash + (actualMtn || 0) + (actualAirtel || 0)
  const variance     = preview ? totalActual - preview.total_expected : null

  const onSubmit = async (values: ReconciliationFormValues) => {
    const result = await submit.mutateAsync({
      branch_id:           values.branch_id,
      reconciliation_date: values.reconciliation_date,
      actual_cash:         actualCash,
      actual_mtn_momo:     values.actual_mtn_momo,
      actual_airtel_money: values.actual_airtel_money,
      notes:               values.notes,
      denominations:       values.denominations
        .filter((d) => d.count > 0)
        .map((d) => ({ denomination: d.denomination, count: d.count })),
    })
    onDone(result.reconciliation_id)
  }

  const isApproved = preview?.existing_status === 'approved'

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {isApproved && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This reconciliation has been approved and is read-only.
        </Alert>
      )}

      {/* ── Expected vs actual summary ── */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
          System expected (from sales)
        </Typography>
        {previewLoading ? (
          <Stack spacing={0.75}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={24} />)}
          </Stack>
        ) : preview ? (
          <Grid container spacing={1.5}>
            {[
              { label: 'Expected cash',      value: preview.expected_cash },
              { label: 'Expected MTN MoMo',  value: preview.expected_mtn_momo },
              { label: 'Expected Airtel',    value: preview.expected_airtel_money },
              { label: 'Total expected',     value: preview.total_expected },
            ].map(({ label, value }) => (
              <Grid item xs={6} sm={3} key={label}>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                  {formatUGX(value)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        ) : null}
      </Paper>

      {/* ── Cash denomination counting ── */}
      <Typography variant="subtitle2" fontWeight={700} mb={1}>
        Cash count by denomination
      </Typography>
      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2.5, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>Denomination (UGX)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700, width: 110 }}>Count</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, width: 140 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {DENOMINATIONS.map((denom, i) => (
              <TableRow key={denom.value} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                    {denom.label}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Controller
                    name={`denominations.${i}.count`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        value={field.value}
                        onChange={(e) => field.onChange(Math.max(0, parseInt(e.target.value) || 0))}
                        type="number"
                        size="small"
                        disabled={isApproved}
                        inputProps={{ min: 0, style: { textAlign: 'center', width: 70 } }}
                        variant="outlined"
                        sx={{ '& .MuiInputBase-root': { height: 32 } }}
                      />
                    )}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                    {formatUGX(denom.value * (denominations[i]?.count ?? 0))}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Divider />
        <Box px={2} py={1.25} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" fontWeight={700}>Total cash counted</Typography>
          <Typography variant="subtitle1" fontWeight={800} fontFamily="monospace" color="primary.main">
            {formatUGX(actualCash)}
          </Typography>
        </Box>
      </Paper>

      {/* ── Mobile money actuals ── */}
      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
        Mobile money actuals
      </Typography>
      <Grid container spacing={2} mb={2.5}>
        <Grid item xs={12} sm={6}>
          <TextField
            {...register('actual_mtn_momo', { valueAsNumber: true })}
            label="MTN MoMo actual"
            type="number"
            fullWidth
            size="small"
            disabled={isApproved}
            error={!!errors.actual_mtn_momo}
            helperText={errors.actual_mtn_momo?.message}
            InputProps={{
              startAdornment: <InputAdornment position="start">UGX</InputAdornment>,
              inputProps: { min: 0 },
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            {...register('actual_airtel_money', { valueAsNumber: true })}
            label="Airtel Money actual"
            type="number"
            fullWidth
            size="small"
            disabled={isApproved}
            error={!!errors.actual_airtel_money}
            helperText={errors.actual_airtel_money?.message}
            InputProps={{
              startAdornment: <InputAdornment position="start">UGX</InputAdornment>,
              inputProps: { min: 0 },
            }}
          />
        </Grid>
      </Grid>

      {/* ── Variance summary ── */}
      {preview && (
        <Paper
          variant="outlined"
          sx={{
            p: 2, borderRadius: 2, mb: 2.5,
            borderColor: variance === 0 ? 'success.main'
              : (variance ?? 0) < 0 ? 'error.main'
              : 'warning.main',
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total expected</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                {formatUGX(preview.total_expected)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total actual</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                {formatUGX(totalActual)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary">Variance</Typography>
              <Typography
                variant="h6"
                fontWeight={800}
                fontFamily="monospace"
                color={variance === 0 ? 'success.main' : (variance ?? 0) < 0 ? 'error.main' : 'warning.main'}
              >
                {variance !== null && variance >= 0 ? '+' : ''}
                {variance !== null ? formatUGX(variance) : '—'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* ── Notes ── */}
      <Box mb={3}>
        <TextField
          {...register('notes')}
          label="Notes (optional)"
          multiline
          minRows={2}
          fullWidth
          size="small"
          disabled={isApproved}
          placeholder="Any discrepancies or remarks…"
        />
      </Box>

      {!isApproved && (
        <Stack direction="row" justifyContent="flex-end">
          <Button
            type="submit"
            variant="contained"
            disabled={submit.isPending || previewLoading}
            startIcon={
              submit.isPending
                ? <CircularProgress size={16} color="inherit" />
                : <CheckCircleIcon />
            }
          >
            Submit reconciliation
          </Button>
        </Stack>
      )}
    </form>
  )
}
