import { useState, useMemo } from 'react'
import {
  Box, Button, Chip, IconButton,
  Switch, FormControlLabel, Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import { DeleteConfirmationModal } from '@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal'
import EditIcon     from '@mui/icons-material/Edit'
import DeleteIcon   from '@mui/icons-material/Delete'
import AddIcon      from '@mui/icons-material/Add'
import ToggleOnIcon  from '@mui/icons-material/ToggleOn'
import ToggleOffIcon from '@mui/icons-material/ToggleOff'

import { useCustomers }                                           from '@/hooks/customers/useCustomers'
import { useDeleteCustomer, useToggleCustomerActive }             from '@/hooks/customers/useCustomerMutations'
import { CustomerForm }                                           from '@/components/organisms/CustomerForm/CustomerForm'
import { SearchTextField }                                        from '@/components/molecules/SearchTextField'
import { ResponsiveStack, responsiveWidth }                        from '@/components/molecules/ResponsiveStack'
import { formatDate }                                             from '@/lib/formatters'
import type { Customer } from '@/types/database.types'

const TYPE_LABELS: Record<string, string> = {
  walk_in:  'Walk-in',
  account:  'Account',
  delivery: 'Delivery',
}

export function CustomerTable() {
  const [search,       setSearch]       = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [editing,      setEditing]      = useState<Customer | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null)

  const { data: customers = [], isLoading } = useCustomers({ search, showInactive })
  const toggleActive = useToggleCustomerActive()
  const deleteCustomer = useDeleteCustomer()

  const columns: GridColDef<Customer>[] = useMemo(() => [
    {
      field: 'full_name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 180,
      renderCell: ({ row }: GridRenderCellParams<Customer>) => (
        <Box py={0.5}>
          <Typography variant="body2" fontWeight={600}>{row.full_name}</Typography>
          {row.email && (
            <Typography variant="caption" color="text.secondary" display="block">{row.email}</Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'phone',
      headerName: 'Phone',
      width: 150,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>
          {value ?? '—'}
        </Typography>
      ),
    },
    {
      field: 'customer_type',
      headerName: 'Type',
      width: 110,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Chip
          label={TYPE_LABELS[value] ?? value}
          size="small"
          variant="outlined"
          sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Joined',
      width: 120,
      valueFormatter: (v: string) => formatDate(v),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 90,
      renderCell: ({ row }: GridRenderCellParams<Customer>) => (
        <Chip
          label={row.is_active ? 'Active' : 'Inactive'}
          size="small"
          color={row.is_active ? 'success' : 'default'}
          variant={row.is_active ? 'filled' : 'outlined'}
          sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: ({ row }: GridRenderCellParams<Customer>) => (
        <Box display="flex" gap={0.25}>
          <Tooltip title="Edit" arrow>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditing(row); setDialogOpen(true) }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={row.is_active ? 'Deactivate' : 'Activate'} arrow>
            <IconButton
              size="small"
              color={row.is_active ? 'error' : 'success'}
              onClick={(e) => { e.stopPropagation(); toggleActive.mutate({ id: row.id, isActive: !row.is_active }) }}
            >
              {row.is_active ? <ToggleOffIcon fontSize="small" /> : <ToggleOnIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow>
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row) }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [toggleActive])

  return (
    <Box>
      {/* Toolbar */}
      <ResponsiveStack spacing={1.5} mb={2}>
        <SearchTextField
          placeholder="Search by name, phone, or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 380 } }}
        />
        <FormControlLabel
          control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} size="small" />}
          label={<Typography variant="body2">Show inactive</Typography>}
          sx={responsiveWidth()}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => { setEditing(undefined); setDialogOpen(true) }}
          sx={{ ...responsiveWidth(), whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Add customer
        </Button>
      </ResponsiveStack>

      <AppDataGrid
        rows={customers}
        columns={columns}
        loading={isLoading}
        pageSizeOptions={[25, 50]}
      />

      <CustomerForm
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={editing}
      />

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        open={!!deleteConfirm}
        title="Delete customer?"
        itemName={deleteConfirm?.full_name ?? ''}
        description="You are about to soft-delete"
        warningMessage="Historical sales data for this customer will be preserved, but they will no longer appear in active customer lists."
        isPending={deleteCustomer.isPending}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteCustomer.mutate(deleteConfirm.id, {
              onSuccess: () => setDeleteConfirm(null),
            })
          }
        }}
        onClose={() => setDeleteConfirm(null)}
        confirmButtonText="Delete"
      />
    </Box>
  )
}
