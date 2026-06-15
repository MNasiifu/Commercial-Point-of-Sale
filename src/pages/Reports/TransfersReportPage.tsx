import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton, Paper, TextField, Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import TableChartIcon from '@mui/icons-material/TableChart'

import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { BranchSelect } from '@/components/molecules/BranchSelect/BranchSelect'
import { TRANSFER_STATUS_COLOR } from '@/components/organisms/TransferTable/TransferTable'
import { useTransferReport } from '@/hooks/reports/useReports'
import { useAuth } from '@/hooks/auth/useAuth'
import { downloadExcel } from '@/lib/reports/exportExcel'
import { formatDateTime, formatDateInput } from '@/lib/formatters'
import type { TransferReportRow, TransferReportFilters } from '@/services/reportService'

function monthStart() {
  const d = new Date()
  return formatDateInput(new Date(d.getFullYear(), d.getMonth(), 1).toISOString())
}

export function TransfersReportPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [filters, setFilters] = useState<TransferReportFilters>({
    dateFrom: monthStart(),
    dateTo: formatDateInput(new Date().toISOString()),
    branchId: role === 'admin' ? null : undefined,
  })
  const [enabled, setEnabled] = useState(false)

  const { data: rows = [], isLoading, isError, refetch } = useTransferReport(filters, enabled)

  const handleRun = () => { if (enabled) refetch(); else setEnabled(true) }

  const columns: GridColDef<TransferReportRow>[] = useMemo(() => [
    {
      field: 'transfer_number', headerName: 'Transfer #', width: 160,
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" fontWeight={600} fontFamily="monospace">{value as string}</Typography>,
    },
    { field: 'from_branch', headerName: 'From', flex: 1, minWidth: 120 },
    { field: 'to_branch', headerName: 'To', flex: 1, minWidth: 120 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ row }: GridRenderCellParams<TransferReportRow>) => (
        <Chip label={row.status} size="small" color={TRANSFER_STATUS_COLOR[row.status]}
          variant={row.status === 'received' ? 'filled' : 'outlined'}
          sx={{ borderRadius: '6px', fontSize: '0.7rem', textTransform: 'capitalize' }} />
      ),
    },
    { field: 'items_count', headerName: 'Items', width: 80, align: 'right', headerAlign: 'right' },
    { field: 'total_sent', headerName: 'Sent', width: 90, align: 'right', headerAlign: 'right' },
    {
      field: 'total_received', headerName: 'Received', width: 100, align: 'right', headerAlign: 'right',
      renderCell: ({ row }: GridRenderCellParams<TransferReportRow>) => (
        <Typography variant="body2"
          color={row.status === 'received' && row.total_received < row.total_sent ? 'warning.main' : 'text.primary'}>
          {row.total_received}
        </Typography>
      ),
    },
    { field: 'created_at', headerName: 'Sent on', width: 160, valueFormatter: (v: string) => formatDateTime(v) },
    {
      field: 'received_at', headerName: 'Received on', width: 160,
      renderCell: ({ row }: GridRenderCellParams<TransferReportRow>) => (
        <Typography variant="body2" color="text.secondary">{row.received_at ? formatDateTime(row.received_at) : '—'}</Typography>
      ),
    },
  ], [])

  const handleExportExcel = async () => {
    await downloadExcel(
      'Transfers',
      [
        { header: 'Transfer #', key: 'transfer_number', width: 18 },
        { header: 'From', key: 'from_branch', width: 16 },
        { header: 'To', key: 'to_branch', width: 16 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Items', key: 'items_count', width: 8 },
        { header: 'Sent', key: 'total_sent', width: 10 },
        { header: 'Received', key: 'total_received', width: 10 },
        { header: 'Sent on', key: 'created_at', width: 22 },
        { header: 'Received on', key: 'received_at', width: 22 },
      ],
      rows.map((r) => ({
        ...r,
        created_at: formatDateTime(r.created_at),
        received_at: r.received_at ? formatDateTime(r.received_at) : '',
      })) as Record<string, unknown>[],
      `Transfers_${filters.dateFrom}_to_${filters.dateTo}.xlsx`,
      { Period: `${filters.dateFrom} to ${filters.dateTo}` },
    )
  }

  return (
    <DashboardTemplate>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5} mb={3}>
        <Box display="flex" alignItems="center" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          <Tooltip title="Back to reports" arrow>
            <IconButton size="small" onClick={() => navigate('/reports')}><ArrowBackIcon /></IconButton>
          </Tooltip>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: 'block', sm: 'none' } }}>Transfers Report</Typography>
        </Box>
        <Box flex={{ sm: 1 }} width={{ xs: '100%', sm: 'auto' }}>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>Transfers Report</Typography>
          <Typography variant="body2" color="text.secondary">Stock movements between the main store and branches.</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportExcel} disabled={rows.length === 0}>Excel</Button>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          <TextField label="From" type="date" size="small" fullWidth value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" fullWidth value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} InputLabelProps={{ shrink: true }} />
          {role === 'admin' && (
            <BranchSelect value={filters.branchId} onChange={(v) => setFilters((f) => ({ ...f, branchId: v }))} />
          )}
          <Button variant="contained" size="small" fullWidth
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRun} disabled={isLoading}>Run report</Button>
        </Box>
      </Paper>

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load report.</Alert>}

      {!enabled && !isLoading && (
        <Box py={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Set your filters and click <strong>Run report</strong> to load data.
          </Typography>
        </Box>
      )}

      {enabled && (
        <AppDataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.transfer_number}
          loading={isLoading}
          density="compact"
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        />
      )}
    </DashboardTemplate>
  )
}
