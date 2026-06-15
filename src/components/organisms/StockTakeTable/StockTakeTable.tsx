import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, TextField, Tooltip, Typography, Stack,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import { DeleteConfirmationModal } from '@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal'
import AddIcon        from '@mui/icons-material/Add'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DeleteIcon     from '@mui/icons-material/Delete'

import { useStockTakes, useCreateStockTake, useDeleteStockTake } from '@/hooks/inventory/useStockTakes'
import { formatDate } from '@/lib/formatters'
import type { StockTakeWithDetails } from '@/services/stockTakeService'
import type { StockTakeStatus } from '@/types/database.types'

const STATUS_CONFIG: Record<StockTakeStatus, { label: string; color: 'default' | 'info' | 'success' | 'error' }> = {
  draft:       { label: 'Draft',       color: 'default' },
  in_progress: { label: 'In Progress', color: 'info'    },
  completed:   { label: 'Completed',   color: 'success' },
  cancelled:   { label: 'Cancelled',   color: 'error'   },
}

export function StockTakeTable() {
  const navigate = useNavigate()
  const { data: stockTakes = [], isLoading } = useStockTakes()
  const createMutation = useCreateStockTake()
  const deleteMutation = useDeleteStockTake()

  const [createOpen, setCreateOpen] = useState(false)
  const [notes, setNotes]           = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<StockTakeWithDetails | null>(null)

  const handleCreate = () => {
    createMutation.mutate(notes || undefined, {
      onSuccess: () => { setCreateOpen(false); setNotes('') },
    })
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id, {
        onSuccess: () => setDeleteConfirm(null),
      })
    }
  }

  const columns: GridColDef<StockTakeWithDetails>[] = useMemo(() => [
    {
      field: 'started_at', headerName: 'Started', width: 160,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2">{formatDate(value as string)}</Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: ({ value }: GridRenderCellParams) => {
        const cfg = STATUS_CONFIG[value as StockTakeStatus]
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
      field: 'item_count', headerName: 'Items', width: 90, align: 'center', headerAlign: 'center',
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" fontWeight={600}>{value as number}</Typography>
      ),
    },
    {
      field: 'started_by_profile', headerName: 'Started By', flex: 1, minWidth: 150,
      valueGetter: (_: unknown, row: StockTakeWithDetails) => row.started_by_profile?.full_name ?? '—',
    },
    {
      field: 'completed_at', headerName: 'Completed', width: 160,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>
          {value ? formatDate(value as string) : '—'}
        </Typography>
      ),
    },
    {
      field: 'notes', headerName: 'Notes', flex: 1, minWidth: 140,
      renderCell: ({ value }: GridRenderCellParams) => (
        <Typography variant="body2" noWrap color="text.secondary">
          {(value as string) || '—'}
        </Typography>
      ),
    },
    {
      field: 'actions', headerName: '', width: 90, sortable: false,
      renderCell: ({ row }: GridRenderCellParams<StockTakeWithDetails>) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View / manage" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); navigate(`/inventory/stock-takes/${row.id}`) }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'draft' && (
            <Tooltip title="Delete draft" arrow>
              <IconButton
                size="small"
                color="error"
                onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row) }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ], [navigate, deleteMutation])

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={{ xs: 1.5, md: 0 }}
        mb={3}
      >
        <Box flex={{ md: 1 }} width={{ xs: '100%', md: 'auto' }}>
          <Typography variant="h5" fontWeight={700}>Stock Takes</Typography>
          <Typography variant="body2" color="text.secondary">
            Count physical inventory and reconcile with system quantities.
          </Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ width: { xs: '100%', md: 'auto' } }}>
          New Stock Take
        </Button>
      </Box>

      <AppDataGrid
        rows={stockTakes}
        columns={columns}
        loading={isLoading}
        onRowClick={({ row }) => navigate(`/inventory/stock-takes/${row.id}`)}
        pageSizeOptions={[25, 50]}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
          sorting:    { sortModel: [{ field: 'started_at', sort: 'desc' }] },
        }}
      />

      {/* Create dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Stock Take</DialogTitle>
        <DialogContent>
          <TextField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline rows={2}
            fullWidth size="small"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation modal */}
      <DeleteConfirmationModal
        open={!!deleteConfirm}
        title="Delete stock take?"
        itemName={deleteConfirm ? `Stock Take (${formatDate(deleteConfirm.started_at)})` : ''}
        description="You are about to permanently delete this"
        warningMessage="All recorded counts and data for this stock take will be lost. This action cannot be undone."
        isPending={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        confirmButtonText="Delete"
      />
    </Box>
  )
}
