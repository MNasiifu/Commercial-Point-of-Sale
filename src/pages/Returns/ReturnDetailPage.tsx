import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, Divider,
  Grid, IconButton, Paper, Stack,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

import { DashboardTemplate }          from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { useReturn }                  from '@/hooks/returns/useReturns'
import { formatUGX, formatDateTime, formatPaymentMethod } from '@/lib/formatters'
import type { ReturnStatus, ReturnType } from '@/types/database.types'

const STATUS_CONFIG: Record<ReturnStatus, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' }> = {
  pending:   { label: 'Pending',   color: 'warning' },
  approved:  { label: 'Approved',  color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  rejected:  { label: 'Rejected',  color: 'error' },
}

const TYPE_LABELS: Record<ReturnType, string> = {
  restock:  'Restock',
  writeoff: 'Write-off',
}

export function ReturnDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: ret, isLoading, isError } = useReturn(id)

  if (isLoading) {
    return (
      <DashboardTemplate>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </DashboardTemplate>
    )
  }

  if (isError || !ret) {
    return (
      <DashboardTemplate>
        <Alert severity="error">Return record not found.</Alert>
      </DashboardTemplate>
    )
  }

  const statusCfg = STATUS_CONFIG[ret.status]

  return (
    <DashboardTemplate>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Tooltip title="Back to returns" arrow>
          <IconButton size="small" onClick={() => navigate('/returns')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Typography variant="h6" fontWeight={700} fontFamily="monospace">
              {ret.return_number}
            </Typography>
            <Chip
              label={statusCfg.label}
              size="small"
              color={statusCfg.color}
              variant="filled"
              sx={{ borderRadius: '6px' }}
            />
            <Chip
              label={TYPE_LABELS[ret.return_type]}
              size="small"
              variant="outlined"
              sx={{ borderRadius: '6px' }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDateTime(ret.created_at)}
            {ret.sales && ` · Sale ${ret.sales.sale_number}`}
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          onClick={() => ret.sales && navigate(`/pos`)}
          sx={{ display: 'none' }}
        >
          {/* placeholder for future actions */}
        </Button>
      </Box>

      <Grid container spacing={2.5}>
        {/* Meta info panel */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Details</Typography>
            <Stack spacing={1}>
              <InfoRow label="Return #"      value={ret.return_number} mono />
              <InfoRow label="Original sale" value={ret.sales?.sale_number ?? '—'} mono />
              <InfoRow label="Customer"      value={ret.customers?.full_name ?? '—'} />
              {ret.customers?.phone && (
                <InfoRow label="Phone"       value={ret.customers.phone} />
              )}
              <InfoRow label="Return type"   value={TYPE_LABELS[ret.return_type]} />
              <InfoRow
                label="Refund method"
                value={ret.refund_method ? formatPaymentMethod(ret.refund_method) : '—'}
              />
              <InfoRow label="Total refund"  value={formatUGX(ret.total_refund)} mono />
              <InfoRow label="Status"        value={statusCfg.label} />
              {ret.reason && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Reason</Typography>
                  <Typography variant="body2">{ret.reason}</Typography>
                </Box>
              )}
              {ret.notes && (
                <Box>
                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                  <Typography variant="body2" color="text.secondary">{ret.notes}</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Returned items */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 2 }}>
            <Box px={2} pt={2} pb={1}>
              <Typography variant="subtitle2" fontWeight={700}>Returned items</Typography>
            </Box>
            <Divider />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="center">Qty returned</TableCell>
                  <TableCell align="right">Refund amount</TableCell>
                  <TableCell align="center">Restocked</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ret.return_items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {item.products?.name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[item.products?.sizes?.name, item.products?.colors?.name].filter(Boolean).join(' · ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{item.quantity_returned}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                        {formatUGX(item.refund_amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.restocked ? 'Yes' : 'No'}
                        size="small"
                        color={item.restocked ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ borderRadius: '4px', fontSize: '0.65rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Divider />
            <Box px={2} py={1.5} display="flex" justifyContent="flex-end">
              <Typography variant="subtitle1" fontWeight={700}>
                Total refund: {formatUGX(ret.total_refund)}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </DashboardTemplate>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontFamily={mono ? 'monospace' : undefined} fontWeight={mono ? 600 : undefined}>
        {value}
      </Typography>
    </Box>
  )
}
