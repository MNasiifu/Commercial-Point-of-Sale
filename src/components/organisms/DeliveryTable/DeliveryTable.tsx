import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Chip, FormControl, IconButton,
  InputLabel, MenuItem, Select, Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import { ResponsiveStack, responsiveWidth } from '@/components/molecules/ResponsiveStack'
import VisibilityIcon   from '@mui/icons-material/Visibility'
import AddIcon          from '@mui/icons-material/Add'

import { useDeliveries }          from '@/hooks/deliveries/useDeliveries'
import { formatDateTime }         from '@/lib/formatters'
import { formatUGX }              from '@/lib/formatters'
import type { DeliveryWithDetails } from '@/services/deliveryService'
import type { DeliveryStatus } from '@/types/database.types'

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: 'default' | 'info' | 'warning' | 'primary' | 'secondary' | 'success' | 'error' }> = {
  pending:    { label: 'Pending',    color: 'default' },
  confirmed:  { label: 'Confirmed',  color: 'info' },
  preparing:  { label: 'Preparing',  color: 'warning' },
  dispatched: { label: 'Dispatched', color: 'primary' },
  delivered:  { label: 'Delivered',  color: 'success' },
  cancelled:  { label: 'Cancelled',  color: 'error' },
}

const SOURCE_LABELS: Record<string, string> = {
  phone:     'Phone',
  whatsapp:  'WhatsApp',
  walk_in:   'Walk-in',
  other:     'Other',
}

interface Props {
  onNewDelivery: () => void
}

export function DeliveryTable({ onNewDelivery }: Props) {
  const navigate = useNavigate()
  const [search,  setSearch]  = useState('')
  const [status,  setStatus]  = useState<DeliveryStatus | ''>('')

  const { data: orders = [], isLoading } = useDeliveries({ search, status })

  const columns: GridColDef<DeliveryWithDetails>[] = useMemo(() => [
    {
      field: 'order_number',
      headerName: 'Order #',
      width: 160,
      renderCell: ({ row }: GridRenderCellParams<DeliveryWithDetails>) => (
        <Box py={0.5}>
          <Typography variant="body2" fontWeight={600} fontFamily="monospace">
            {row.order_number}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {SOURCE_LABELS[row.order_source] ?? row.order_source}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      flex: 1,
      minWidth: 160,
      renderCell: ({ row }: GridRenderCellParams<DeliveryWithDetails>) => (
        <Box py={0.5}>
          <Typography variant="body2" fontWeight={600}>
            {row.customer_name ?? row.customers?.full_name ?? '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.customer_phone ?? row.customers?.phone ?? ''}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'delivery_address',
      headerName: 'Address',
      flex: 1,
      minWidth: 150,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'} noWrap>
          {value ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'total_amount',
      headerName: 'Total',
      width: 130,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600} fontFamily="monospace">
          {formatUGX(value as number)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: ({ value }: GridRenderCellParams) => {
        const cfg = STATUS_CONFIG[value as DeliveryStatus] ?? { label: value, color: 'default' }
        return (
          <Chip
            label={cfg.label}
            size="small"
            color={cfg.color}
            variant="filled"
            sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
          />
        )
      },
    },
    {
      field: 'created_at',
      headerName: 'Ordered',
      width: 150,
      valueFormatter: (v: string) => formatDateTime(v),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<DeliveryWithDetails>) => (
        <Tooltip title="View details" arrow>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); navigate(`/delivery-orders/${row.id}`) }}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [navigate])

  return (
    <Box>
      <ResponsiveStack spacing={1.5} mb={2}>
        <SearchTextField
          placeholder="Search by order #, customer, or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 360 } }}
        />
        <FormControl size="small" sx={responsiveWidth(150)}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as DeliveryStatus | '')}
            label="Status"
          >
            <MenuItem value="">All statuses</MenuItem>
            {(Object.entries(STATUS_CONFIG) as [DeliveryStatus, { label: string }][]).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={onNewDelivery}
          sx={{ ...responsiveWidth(), whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          New delivery order
        </Button>
      </ResponsiveStack>

      <AppDataGrid
        rows={orders}
        columns={columns}
        loading={isLoading}
        onRowClick={({ row }) => navigate(`/delivery-orders/${row.id}`)}
        pageSizeOptions={[25, 50]}
      />
    </Box>
  )
}
