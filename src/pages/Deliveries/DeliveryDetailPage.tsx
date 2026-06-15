import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Grid, IconButton, Paper, Stack, Step, StepLabel, Stepper,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import ArrowBackIcon    from '@mui/icons-material/ArrowBack'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CancelIcon       from '@mui/icons-material/Cancel'
import CheckIcon        from '@mui/icons-material/Check'

import { DashboardTemplate }        from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { useDelivery }              from '@/hooks/deliveries/useDeliveries'
import { useUpdateDeliveryStatus, useCancelDelivery } from '@/hooks/deliveries/useDeliveryMutations'
import { useCartStore }             from '@/store/cartStore'
import { formatDateTime, formatUGX } from '@/lib/formatters'
import type { DeliveryStatus }      from '@/types/database.types'

const STATUS_STEPS: DeliveryStatus[] = ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered']

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: 'default' | 'info' | 'warning' | 'primary' | 'success' | 'error' }> = {
  pending:    { label: 'Pending',    color: 'default' },
  confirmed:  { label: 'Confirmed',  color: 'info' },
  preparing:  { label: 'Preparing',  color: 'warning' },
  dispatched: { label: 'Dispatched', color: 'primary' },
  delivered:  { label: 'Delivered',  color: 'success' },
  cancelled:  { label: 'Cancelled',  color: 'error' },
}

const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  pending:    'confirmed',
  confirmed:  'preparing',
  preparing:  'dispatched',
  dispatched: 'delivered',
}

const SOURCE_LABELS: Record<string, string> = {
  phone: 'Phone call', whatsapp: 'WhatsApp', walk_in: 'Walk-in', other: 'Other',
}

export function DeliveryDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const addProduct = useCartStore((s) => s.addProduct)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const clearCart   = useCartStore((s) => s.clearCart)

  const { data: order, isLoading, isError } = useDelivery(id)
  const updateStatus = useUpdateDeliveryStatus()
  const cancel       = useCancelDelivery()

  if (isLoading) {
    return (
      <DashboardTemplate>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </DashboardTemplate>
    )
  }

  if (isError || !order) {
    return (
      <DashboardTemplate>
        <Alert severity="error">Delivery order not found.</Alert>
      </DashboardTemplate>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const isDone      = isCancelled || isDelivered
  const nextStatus  = NEXT_STATUS[order.status]
  const stepIndex   = STATUS_STEPS.indexOf(order.status as DeliveryStatus)
  const cfg         = STATUS_CONFIG[order.status]

  const customerName  = order.customer_name ?? order.customers?.full_name ?? '—'
  const customerPhone = order.customer_phone ?? order.customers?.phone ?? ''

  const handleLoadToPos = () => {
    clearCart()
    setCustomer(order.customer_id ?? null, customerName)
    order.delivery_order_items.forEach((item) => {
      addProduct({
        product_id:          item.product_id,
        product_name:        item.products?.name ?? 'Unknown product',
        brand_name:          null,
        garment_type_name:   null,
        size_name:           item.products?.sizes?.name ?? null,
        color_name:          item.products?.colors?.name ?? null,
        barcode:             null,
        pack_size:           1,
        retail_price:        item.unit_price,
        wholesale_price:     item.unit_price,
        wholesale_threshold: 6,
        stock_available:     999,
      }, item.quantity)
    })
    navigate('/pos')
  }

  return (
    <DashboardTemplate>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Tooltip title="Back to deliveries" arrow>
          <IconButton size="small" onClick={() => navigate('/delivery-orders')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h6" fontWeight={700} fontFamily="monospace">
              {order.order_number}
            </Typography>
            <Chip
              label={cfg.label}
              size="small"
              color={cfg.color}
              variant="filled"
              sx={{ borderRadius: '6px' }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {SOURCE_LABELS[order.order_source]} · {formatDateTime(order.created_at)}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexShrink={0}>
          {!isDone && order.delivery_order_items.length > 0 && (
            <Button
              variant="contained"
              startIcon={<ShoppingCartIcon />}
              size="small"
              onClick={handleLoadToPos}
            >
              Process sale
            </Button>
          )}
          {!isDone && nextStatus && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckIcon />}
              onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
              disabled={updateStatus.isPending}
            >
              Mark {STATUS_CONFIG[nextStatus].label}
            </Button>
          )}
          {!isDone && (
            <Tooltip title="Cancel order" arrow>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => cancel.mutate(order.id)}
                disabled={cancel.isPending}
              >
                Cancel
              </Button>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Status stepper */}
      {!isCancelled && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
          <Stepper activeStep={stepIndex} alternativeLabel>
            {STATUS_STEPS.map((s) => (
              <Step key={s} completed={STATUS_STEPS.indexOf(s) < stepIndex}>
                <StepLabel>{STATUS_CONFIG[s].label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      )}
      {isCancelled && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          This delivery order has been cancelled.
        </Alert>
      )}

      <Grid container spacing={2.5}>
        {/* Customer details */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Customer</Typography>
            <Stack spacing={0.75}>
              <Box>
                <Typography variant="caption" color="text.secondary">Name</Typography>
                <Typography variant="body2" fontWeight={600}>{customerName}</Typography>
              </Box>
              {customerPhone && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Phone</Typography>
                  <Typography variant="body2">{customerPhone}</Typography>
                </Box>
              )}
              {order.delivery_address && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Delivery address</Typography>
                  <Typography variant="body2">{order.delivery_address}</Typography>
                </Box>
              )}
              {order.delivery_notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{order.delivery_notes}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Order items */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box px={2} pt={2} pb={1}>
              <Typography variant="subtitle2" fontWeight={700}>Order items</Typography>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Qty</TableCell>
                  <TableCell align="right">Unit price</TableCell>
                  <TableCell align="right">Line total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.delivery_order_items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.products?.name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block">
                        {[item.products?.sizes?.name, item.products?.colors?.name].filter(Boolean).join(' · ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{item.quantity}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace">
                        {formatUGX(item.unit_price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} fontFamily="monospace">
                        {formatUGX(item.line_total)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider />
            <Box px={2} py={1.5} display="flex" justifyContent="flex-end">
              <Typography variant="subtitle1" fontWeight={700}>
                Total: {formatUGX(order.total_amount)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardTemplate>
  )
}
