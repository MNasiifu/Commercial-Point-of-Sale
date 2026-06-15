import { useState } from 'react'
import {
  Alert, Box, Divider, Grid, Paper, Skeleton,
  Stack, TextField, Typography,
} from '@mui/material'
import AttachMoneyIcon  from '@mui/icons-material/AttachMoney'
import ReceiptLongIcon  from '@mui/icons-material/ReceiptLong'
import PercentIcon      from '@mui/icons-material/Percent'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { StatCard }          from '@/components/molecules/StatCard/StatCard'
import { useTellerSummary }  from '@/hooks/dashboard/useDashboard'
import { formatUGX, formatDateInput, formatPaymentMethod } from '@/lib/formatters'
import type { PaymentMethod } from '@/types/database.types'

const PAYMENT_COLORS: Record<PaymentMethod, string> = {
  cash:          '#4caf50',
  mtn_momo:      '#ffb300',
  airtel_money:  '#f44336',
}

export function MySummaryPage() {
  const todayStr = formatDateInput(new Date().toISOString())
  const [dateFrom, setDateFrom] = useState(todayStr)
  const [dateTo,   setDateTo]   = useState(todayStr)

  const { data: summary, isLoading, isError } = useTellerSummary({
    dateFrom: dateFrom || null,
    dateTo:   dateTo   || null,
  })

  return (
    <DashboardTemplate>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>My Sales Summary</Typography>
        <Typography variant="body2" color="text.secondary">
          Your personal sales performance report.
        </Typography>
      </Box>

      {/* Date range controls */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Typography variant="body2" fontWeight={600} flexShrink={0}>
            Date range
          </Typography>
          <TextField
            label="From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 180 }}
          />
          <Typography variant="body2" color="text.secondary">to</Typography>
          <TextField
            label="To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ maxWidth: 180 }}
          />
        </Stack>
      </Paper>

      {isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load summary. Make sure the get_teller_summary RPC is deployed.
        </Alert>
      )}

      {/* KPI cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Transactions"
            value={isLoading ? '—' : summary!.transaction_count}
            subtitle="completed sales"
            icon={<ReceiptLongIcon />}
            iconBg="primary.50"
            iconColor="primary.main"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={isLoading ? '—' : formatUGX(summary!.total_sales)}
            icon={<AttachMoneyIcon />}
            iconBg="success.50"
            iconColor="success.main"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Wholesale Sales"
            value={isLoading ? '—' : summary!.wholesale_count}
            subtitle="6+ packs"
            icon={<PercentIcon />}
            iconBg="info.50"
            iconColor="info.main"
            loading={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Voided Sales"
            value={isLoading ? '—' : summary!.voided_count}
            icon={<WarningAmberIcon />}
            iconBg="warning.50"
            iconColor="warning.main"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      {/* Payment breakdown */}
      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, maxWidth: 420 }}>
        <Typography variant="subtitle2" fontWeight={700} mb={2}>
          Payment method breakdown
        </Typography>

        {isLoading ? (
          <Stack spacing={1}>
            {[1, 2, 3].map((i) => <Skeleton key={i} height={28} />)}
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            {(['cash', 'mtn_momo', 'airtel_money'] as PaymentMethod[]).map((method) => {
              const amount = method === 'cash'
                ? summary!.cash_total
                : method === 'mtn_momo'
                  ? summary!.mtn_momo_total
                  : summary!.airtel_money_total
              return (
                <Box key={method} display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%',
                      bgcolor: PAYMENT_COLORS[method], flexShrink: 0,
                    }} />
                    <Typography variant="body2">{formatPaymentMethod(method)}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                    {formatUGX(amount)}
                  </Typography>
                </Box>
              )
            })}
            <Divider />
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Total</Typography>
              <Typography variant="body2" fontWeight={700} fontFamily="monospace">
                {formatUGX(summary!.total_sales)}
              </Typography>
            </Box>
          </Stack>
        )}
      </Paper>
    </DashboardTemplate>
  )
}
