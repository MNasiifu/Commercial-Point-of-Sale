import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Grid, IconButton, Paper, Stack, Table, TableBody,
  TableCell, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import EditIcon      from '@mui/icons-material/Edit'

import { DashboardTemplate }  from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { useReconciliation }  from '@/hooks/reconciliation/useReconciliation'
import { formatDate, formatUGX, formatDateTime } from '@/lib/formatters'
import type { ReconciliationStatus } from '@/types/database.types'

const STATUS_CONFIG: Record<ReconciliationStatus, { label: string; color: 'default' | 'warning' | 'success' | 'info' }> = {
  open:      { label: 'Open',      color: 'default' },
  submitted: { label: 'Submitted', color: 'warning' },
  approved:  { label: 'Approved',  color: 'success' },
}

function VarianceRow({ label, expected, actual, variance }: { label: string; expected: number; actual: number; variance: number }) {
  const color = variance === 0 ? 'success.main' : variance < 0 ? 'error.main' : 'warning.main'
  return (
    <TableRow hover>
      <TableCell><Typography variant="body2" fontWeight={600}>{label}</Typography></TableCell>
      <TableCell align="right"><Typography variant="body2" fontFamily="monospace">{formatUGX(expected)}</Typography></TableCell>
      <TableCell align="right"><Typography variant="body2" fontFamily="monospace" fontWeight={600}>{formatUGX(actual)}</Typography></TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontFamily="monospace" fontWeight={700} color={color}>
          {variance >= 0 ? '+' : ''}{formatUGX(variance)}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

export function ReconciliationDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: rec, isLoading, isError } = useReconciliation(id)

  if (isLoading) {
    return (
      <DashboardTemplate>
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      </DashboardTemplate>
    )
  }

  if (isError || !rec) {
    return (
      <DashboardTemplate>
        <Alert severity="error">Reconciliation record not found.</Alert>
      </DashboardTemplate>
    )
  }

  const statusCfg = STATUS_CONFIG[rec.status]
  const overallColor = rec.total_variance === 0 ? 'success.main' : rec.total_variance < 0 ? 'error.main' : 'warning.main'

  return (
    <DashboardTemplate>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Tooltip title="Back to reconciliations" arrow>
          <IconButton size="small" onClick={() => navigate('/reports/reconciliation')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h6" fontWeight={700}>
              Reconciliation — {formatDate(rec.reconciliation_date)}
            </Typography>
            <Chip label={statusCfg.label} size="small" color={statusCfg.color}
              variant="filled" sx={{ borderRadius: '6px' }} />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Submitted {rec.submitted_at ? formatDateTime(rec.submitted_at) : '—'}
          </Typography>
        </Box>
        {rec.status === 'submitted' && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => navigate('/reports/reconciliation', { state: { reopenDate: rec.reconciliation_date } })}
          >
            Reopen & edit
          </Button>
        )}
      </Box>

      <Grid container spacing={2.5}>
        {/* Variance breakdown */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box px={2} pt={2} pb={1}>
              <Typography variant="subtitle2" fontWeight={700}>Payment method breakdown</Typography>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Expected</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actual</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Variance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <VarianceRow
                  label="Cash"
                  expected={rec.expected_cash}
                  actual={rec.actual_cash}
                  variance={rec.cash_variance}
                />
                <VarianceRow
                  label="MTN MoMo"
                  expected={rec.expected_mtn_momo}
                  actual={rec.actual_mtn_momo}
                  variance={rec.mtn_momo_variance}
                />
                <VarianceRow
                  label="Airtel Money"
                  expected={rec.expected_airtel_money}
                  actual={rec.actual_airtel_money}
                  variance={rec.airtel_variance}
                />
              </TableBody>
            </Table>
            <Divider />
            <Box px={2} py={1.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
                <Stack direction="row" spacing={4} alignItems="center">
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Expected</Typography>
                    <Typography variant="body2" fontFamily="monospace">{formatUGX(rec.total_expected)}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Actual</Typography>
                    <Typography variant="body2" fontFamily="monospace" fontWeight={700}>{formatUGX(rec.total_actual)}</Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary">Variance</Typography>
                    <Typography variant="subtitle1" fontFamily="monospace" fontWeight={800} color={overallColor}>
                      {rec.total_variance >= 0 ? '+' : ''}{formatUGX(rec.total_variance)}
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </Box>
          </Paper>

          {/* Denomination breakdown */}
          {rec.reconciliation_denominations.length > 0 && (
            <Paper variant="outlined" sx={{ borderRadius: 2, mt: 2.5 }}>
              <Box px={2} pt={2} pb={1}>
                <Typography variant="subtitle2" fontWeight={700}>Cash denomination breakdown</Typography>
              </Box>
              <Divider />
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Denomination (UGX)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Count</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...rec.reconciliation_denominations]
                    .sort((a, b) => b.denomination - a.denomination)
                    .map((d) => (
                      <TableRow key={d.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                            {d.denomination.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{d.count}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontFamily="monospace">{formatUGX(d.total_amount)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              <Divider />
              <Box px={2} py={1} display="flex" justifyContent="flex-end">
                <Typography variant="body2" fontWeight={700}>
                  Cash total: {formatUGX(rec.actual_cash)}
                </Typography>
              </Box>
            </Paper>
          )}
        </Grid>

        {/* Meta panel */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Details</Typography>
            <Stack spacing={1.25}>
              <InfoRow label="Date"         value={formatDate(rec.reconciliation_date)} />
              <InfoRow label="Status"       value={statusCfg.label} />
              <InfoRow label="Overall variance"
                value={(rec.total_variance >= 0 ? '+' : '') + formatUGX(rec.total_variance)}
                valueColor={overallColor}
              />
              {rec.submitted_at && (
                <InfoRow label="Submitted at" value={formatDateTime(rec.submitted_at)} />
              )}
              {rec.approved_at && (
                <InfoRow label="Approved at"  value={formatDateTime(rec.approved_at)} />
              )}
              {rec.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{rec.notes}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </DashboardTemplate>
  )
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={600} color={valueColor}>{value}</Typography>
    </Box>
  )
}
