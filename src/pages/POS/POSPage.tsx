import { useState, useCallback } from 'react'
import {
  Box, Button, Chip, Dialog, DialogContent, DialogTitle,
  Divider, Paper, Stack, Tooltip, Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

import { DashboardTemplate }          from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { ProductSearchBar }           from '@/components/organisms/ProductSearchBar/ProductSearchBar'
import { CartPanel }                  from '@/components/organisms/CartPanel/CartPanel'
import { PaymentPanel }               from '@/components/organisms/PaymentPanel/PaymentPanel'
import { ReceiptDialog }              from '@/components/organisms/ReceiptDialog/ReceiptDialog'
import { CustomerSearchAutocomplete } from '@/components/molecules/CustomerSearchAutocomplete/CustomerSearchAutocomplete'
import { useCartStore }               from '@/store/cartStore'
import { useAuthStore }               from '@/store/authStore'
import { useCompleteSale }            from '@/hooks/pos/useCompleteSale'
import { buildReceipt }               from '@/lib/receipt'
import { notify }                     from '@/store/notificationStore'
import type { PaymentEntry }          from '@/hooks/pos/useCompleteSale'
import type { ReceiptData }           from '@/lib/receipt'
import type { Customer }              from '@/types/database.types'
import { useAuth } from '@/hooks/auth/useAuth'

type PosStep = 'cart' | 'payment'

export function POSPage() {
  const [step,         setStep]         = useState<PosStep>('cart')
  const [receipt,      setReceipt]      = useState<ReceiptData | null>(null)
  const [receiptOpen,  setReceiptOpen]  = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)

  const lines        = useCartStore((s) => s.lines)
  const grandTotal   = useCartStore((s) => s.grandTotal())
  const clearCart    = useCartStore((s) => s.clearCart)
  const customerId   = useCartStore((s) => s.customerId)
  const customerName = useCartStore((s) => s.customerName)
  const setCustomer  = useCartStore((s) => s.setCustomer)
  const itemCount    = useCartStore((s) => s.itemCount())

  const {profile}    = useAuthStore((s) => s)
  const {branchDetails} = useAuth()
  const tellerName = profile?.full_name ?? 'Teller'

  const completeSale  = useCompleteSale()

  const handleCustomerChange = useCallback((c: Customer | null) => {
    setCustomer(c?.id ?? null, c?.full_name ?? null)
  }, [setCustomer])

  const handlePaymentConfirm = useCallback(async (payments: PaymentEntry[], amountTendered: number) => {
    try {
      const result = await completeSale.mutateAsync({
        customerId:  customerId,
        saleType:    customerId ? 'account' : 'walk_in',
        payments,
      })

      setReceipt(buildReceipt({
        result, lines, payments, customerName, tellerName, grandTotal, amountTendered,
        branch: branchDetails,
      }))
      setReceiptOpen(true)
      setStep('cart')
      notify.success(`Sale ${result.sale_number} completed`)
    } catch {
      // error already shown by useCompleteSale
    }
  }, [completeSale, customerId, customerName, grandTotal, lines, tellerName, branchDetails])

  const handleNewSale = () => {
    setReceiptOpen(false)
    setReceipt(null)
  }

  const hasItems = lines.length > 0

  return (
    <DashboardTemplate>
      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', md: '1fr 380px' }}
        gap={2}
        height={{ md: 'calc(100vh - 120px)' }}
        minHeight={0}
      >
        {/* ── Left panel: search + cart ── */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            minHeight: { xs: 400, md: 0 },
          }}
        >
          {/* Toolbar row */}
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            px={2}
            py={1.5}
            borderBottom="1px solid"
            borderColor="divider"
            flexShrink={0}
          >
            <Box flex={1}>
              <ProductSearchBar disabled={step === 'payment' || completeSale.isPending} />
            </Box>

            {customerName && (
              <Chip
                label={`👤 ${customerName}`}
                size="small"
                color="primary"
                variant="outlined"
                onDelete={() => setCustomer(null, null)}
                sx={{ maxWidth: 180 }}
              />
            )}

            {hasItems && (
              <Tooltip title="Clear all items from cart" arrow>
                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={() => setClearConfirm(true)}
                  disabled={step === 'payment'}
                  sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                >
                  Clear
                </Button>
              </Tooltip>
            )}
          </Box>

          {/* Cart lines */}
          <Box flex={1} minHeight={0} overflow="hidden">
            <CartPanel
              disabled={step === 'payment' || completeSale.isPending}
            />
          </Box>
        </Paper>

        {/* ── Right panel: steps ── */}
        <Paper
          variant="outlined"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            p: 2,
            minHeight: { xs: 400, md: 0 },
            overflow: 'auto',
          }}
        >
          {/* Step switcher */}
          <Stack direction="row" spacing={1} mb={2} flexShrink={0}>
            <Button
              variant={step === 'cart' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setStep('cart')}
              sx={{ flex: 1 }}
            >
              1 · Cart
            </Button>
            <Button
              variant={step === 'payment' ? 'contained' : 'outlined'}
              size="small"
              disabled={!hasItems}
              onClick={() => setStep('payment')}
              sx={{ flex: 1 }}
            >
              2 · Payment
            </Button>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          {step === 'cart' ? (
            <Box display="flex" flexDirection="column" justifyContent="space-between" height="100%">
              <Stack spacing={2}>
                {/* Customer selector */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75}>
                    CUSTOMER (OPTIONAL)
                  </Typography>
                  <CustomerSearchAutocomplete
                    onChange={handleCustomerChange}
                    label="Search customer"
                    placeholder="Search by name or phone…"
                    disabled={step !== 'cart'}
                  />
                  {customerName && (
                    <Typography variant="caption" color="primary.main" mt={0.5} display="block">
                      Sale will be linked to: {customerName}
                    </Typography>
                  )}
                </Box>

                <Divider />

                {/* Summary */}
                <Stack spacing={0.75}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Items in cart</Typography>
                    <Typography variant="body2" fontWeight={600}>{itemCount}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Grand total</Typography>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      {grandTotal > 0 ? `UGX ${grandTotal.toLocaleString()}` : '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!hasItems}
                onClick={() => setStep('payment')}
                sx={{ mt: 2, py: 1.5, fontWeight: 700 }}
              >
                Proceed to payment
              </Button>
            </Box>
          ) : (
            <Box flex={1}>
              <PaymentPanel
                grandTotal={grandTotal}
                onConfirm={handlePaymentConfirm}
                isSubmitting={completeSale.isPending}
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Clear cart confirmation */}
      <Dialog open={clearConfirm} onClose={() => setClearConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Clear cart?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            All {lines.length} item{lines.length !== 1 ? 's' : ''} will be removed from the cart.
          </Typography>
        </DialogContent>
        <Box display="flex" gap={1.5} px={3} pb={3}>
          <Button variant="outlined" fullWidth onClick={() => setClearConfirm(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={() => { clearCart(); setClearConfirm(false) }}
          >
            Clear cart
          </Button>
        </Box>
      </Dialog>

      {/* Receipt dialog */}
      <ReceiptDialog
        open={receiptOpen}
        receipt={receipt}
        branchDetails={branchDetails}
        onClose={() => setReceiptOpen(false)}
        onNewSale={handleNewSale}
      />
    </DashboardTemplate>
  )
}
