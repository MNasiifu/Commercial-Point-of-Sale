import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alert, Box, Button, CircularProgress, IconButton, Paper, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import TableChartIcon from '@mui/icons-material/TableChart'
import PrintIcon from '@mui/icons-material/Print'

import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { useGoodsReceived } from '@/hooks/reports/useReports'
import { downloadExcel } from '@/lib/reports/exportExcel'
import { printReport } from '@/lib/reports/exportPdf'
import { formatUGX, formatDate, formatDateInput } from '@/lib/formatters'
import type { GoodsReceivedRow, GoodsReceivedFilters } from '@/services/reportService'

function monthStart() {
  const d = new Date()
  return formatDateInput(new Date(d.getFullYear(), d.getMonth(), 1).toISOString())
}

export function StockReportPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GoodsReceivedFilters>({
    dateFrom: monthStart(),
    dateTo: formatDateInput(new Date().toISOString()),
  })
  const [enabled, setEnabled] = useState(false)

  const { data: rows = [], isLoading, isError, refetch } = useGoodsReceived(filters, enabled)

  const handleRun = () => { if (enabled) refetch(); else setEnabled(true) }

  const totalCost = rows.reduce((s, r) => s + r.cost_value, 0)
  const totalUnits = rows.reduce((s, r) => s + r.quantity, 0)

  const columns: GridColDef<GoodsReceivedRow>[] = useMemo(() => [
    {
      field: 'received_at', headerName: 'Received at', width: 130,
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" fontWeight={600}>{formatDate(value as string)}</Typography>,
    },
    {
      field: 'reference', headerName: 'Reference', width: 140,
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>{(value as string) || '—'}</Typography>,
    },
    {
      field: 'product_name', headerName: 'Product', flex: 1, minWidth: 180,
      renderCell: ({ row }: GridRenderCellParams<GoodsReceivedRow>) => (
        <Typography variant="body2" fontWeight={600}>{row.product_name}</Typography>
      ),
    },
    {
      field: 'category_name', headerName: 'Category', width: 130,
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>{(value as string) ?? '—'}</Typography>,
    },
    {
      field: 'quantity', headerName: 'Qty', width: 80, align: 'right', headerAlign: 'right',
      renderCell: ({ value }: GridRenderCellParams) => <Typography variant="body2" fontWeight={600}>{value as number}</Typography>,
    },
    {
      field: 'cost_price', headerName: 'Unit cost', width: 120, align: 'right', headerAlign: 'right',
      renderCell: ({ value }: GridRenderCellParams) => <Typography variant="body2" fontFamily="monospace">{formatUGX(value as number)}</Typography>,
    },
    {
      field: 'cost_value', headerName: 'Cost value', width: 130, align: 'right', headerAlign: 'right',
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" fontWeight={700} fontFamily="monospace">{formatUGX(value as number)}</Typography>,
    },
    {
      field: 'received_by', headerName: 'Received by', width: 150,
      renderCell: ({ value }: GridRenderCellParams) =>
        <Typography variant="body2" color="text.secondary">{(value as string) || '—'}</Typography>,
    },
  ], [])

  const handleExportExcel = async () => {
    await downloadExcel(
      'Goods Received',
      [
        { header: 'Received at', key: 'received_at', width: 14 },
        { header: 'Reference', key: 'reference', width: 18 },
        { header: 'Product', key: 'product_name', width: 28 },
        { header: 'Category', key: 'category_name', width: 18 },
        { header: 'Qty', key: 'quantity', width: 8 },
        { header: 'Unit cost', key: 'cost_price', width: 14, numFmt: '#,##0' },
        { header: 'Cost value', key: 'cost_value', width: 16, numFmt: '#,##0' },
        { header: 'Received by', key: 'received_by', width: 20 },
      ],
      rows.map((r) => ({ ...r, received_at: formatDate(r.received_at) })) as unknown as Record<string, unknown>[],
      `Goods_Received_${filters.dateFrom}_to_${filters.dateTo}.xlsx`,
      { Period: `${filters.dateFrom} to ${filters.dateTo}`, 'Total cost value': formatUGX(totalCost) },
    )
  }

  const handlePrint = () => {
    printReport({
      title: 'Goods Received Report',
      meta: { Period: `${filters.dateFrom} to ${filters.dateTo}` },
      summary: [
        { label: 'Total cost value', value: formatUGX(totalCost) },
        { label: 'Total units received', value: totalUnits.toLocaleString() },
        { label: 'Line items', value: String(rows.length) },
      ],
      columns: [
        { header: 'Received at', key: 'received_at', render: (v) => formatDate(v as string) },
        { header: 'Reference', key: 'reference' },
        { header: 'Product', key: 'product_name' },
        { header: 'Category', key: 'category_name' },
        { header: 'Qty', key: 'quantity', align: 'right' },
        { header: 'Unit cost', key: 'cost_price', align: 'right', render: (v) => formatUGX(v as number) },
        { header: 'Cost value', key: 'cost_value', align: 'right', render: (v) => formatUGX(v as number) },
        { header: 'Received by', key: 'received_by' },
      ],
      rows: rows as unknown as Record<string, unknown>[],
    })
  }

  return (
    <DashboardTemplate>
      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }} gap={1.5} mb={3}>
        <Box display="flex" alignItems="center" gap={1} width={{ xs: '100%', sm: 'auto' }}>
          <Tooltip title="Back to reports" arrow>
            <IconButton size="small" onClick={() => navigate('/reports')}><ArrowBackIcon /></IconButton>
          </Tooltip>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: 'block', sm: 'none' } }}>Goods Received</Typography>
        </Box>
        <Box flex={{ sm: 1 }} width={{ xs: '100%', sm: 'auto' }}>
          <Typography variant="h5" fontWeight={700} sx={{ display: { xs: 'none', sm: 'block' } }}>Goods Received</Typography>
          <Typography variant="body2" color="text.secondary">Stock received from suppliers into the main store. Excludes inter-branch transfers.</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" width={{ xs: '100%', sm: 'auto' }}>
          <Button size="small" variant="outlined" startIcon={<TableChartIcon />} onClick={handleExportExcel} disabled={rows.length === 0}>Excel</Button>
          <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} disabled={rows.length === 0}>PDF</Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
          <TextField label="From" type="date" size="small" fullWidth value={filters.dateFrom}
            onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField label="To" type="date" size="small" fullWidth value={filters.dateTo}
            onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <Button variant="contained" size="small" fullWidth
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleRun} disabled={isLoading}>Run report</Button>
        </Box>
      </Paper>

      {enabled && rows.length > 0 && (
        <Stack direction="row" spacing={3} mb={2} px={0.5} flexWrap="wrap">
          <Box>
            <Typography variant="caption" color="text.secondary">Total cost value</Typography>
            <Typography variant="subtitle1" fontWeight={700} fontFamily="monospace">{formatUGX(totalCost)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total units received</Typography>
            <Typography variant="subtitle1" fontWeight={700}>{totalUnits.toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Line items</Typography>
            <Typography variant="subtitle1" fontWeight={700}>{rows.length.toLocaleString()}</Typography>
          </Box>
        </Stack>
      )}

      {isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to load report.</Alert>}

      {!enabled && !isLoading && (
        <Box py={6} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Set your date range and click <strong>Run report</strong> to load goods received.
          </Typography>
        </Box>
      )}

      {enabled && (
        <AppDataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          loading={isLoading}
          density="compact"
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
        />
      )}
    </DashboardTemplate>
  )
}
