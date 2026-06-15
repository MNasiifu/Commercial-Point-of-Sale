import { useState, useMemo, type ReactNode } from 'react'
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, Switch, Tooltip, Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useForm, type Control, type FieldErrors, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodTypeAny } from 'zod'

import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import { ResponsiveStack, responsiveWidth } from '@/components/molecules/ResponsiveStack'
import { DeactivateConfirmModal } from '@/components/molecules/DeactivateConfirmModal/DeactivateConfirmModal'
import { usePermissions } from '@/hooks/auth/usePermissions'

interface CatalogRow {
  id: string
  name: string
  is_active: boolean
}

interface MutationLike<V> {
  mutateAsync: (vars: V) => Promise<unknown>
  mutate: (vars: V, opts?: { onSuccess?: () => void }) => void
  isPending: boolean
}

export interface CatalogManagerConfig<T extends CatalogRow, F extends FieldValues> {
  entityLabel: string         // e.g. "Brand"
  entityLabelPlural: string    // e.g. "Brands"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useList: (filters: { search?: string; showInactive?: boolean }) => { data?: T[]; isLoading: boolean }
  useCreate: () => MutationLike<Partial<T>>
  useUpdate: () => MutationLike<{ id: string; data: Partial<T> }>
  useDeactivate: () => MutationLike<string>
  schema: ZodTypeAny
  buildDefaults: (existing?: T) => F
  toPayload: (values: F) => Partial<T>
  renderFields: (control: Control<F>, errors: FieldErrors<F>) => ReactNode
  extraColumns?: GridColDef<T>[]
}

function CatalogDialog<T extends CatalogRow, F extends FieldValues>({
  open, onClose, existing, config,
}: {
  open: boolean
  onClose: () => void
  existing?: T
  config: CatalogManagerConfig<T, F>
}) {
  const create = config.useCreate()
  const update = config.useUpdate()

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<F>({
      resolver: zodResolver(config.schema),
      defaultValues: config.buildDefaults(existing) as never,
    })

  const handleClose = () => { reset(); onClose() }

  const onSubmit = async (values: F) => {
    const payload = config.toPayload(values)
    if (existing) await update.mutateAsync({ id: existing.id, data: payload })
    else await create.mutateAsync(payload)
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{existing ? `Edit ${config.entityLabel.toLowerCase()}` : `Add ${config.entityLabel.toLowerCase()}`}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>{config.renderFields(control, errors)}</DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {existing ? 'Save changes' : `Create ${config.entityLabel.toLowerCase()}`}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export function CatalogManager<T extends CatalogRow, F extends FieldValues>({
  config,
}: {
  config: CatalogManagerConfig<T, F>
}) {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<T | undefined>()
  const [deactivateTarget, setDeactivateTarget] = useState<T | null>(null)

  const { canDeactivateCatalog } = usePermissions()
  const { data: rows = [], isLoading } = config.useList({ search, showInactive })
  const deactivate = config.useDeactivate()

  const columns: GridColDef<T>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }: GridRenderCellParams<T>) => (
          <Typography variant="body2" fontWeight={600}>{row.name}</Typography>
        ),
      },
      ...(config.extraColumns ?? []),
      {
        field: 'is_active',
        headerName: 'Status',
        width: 90,
        renderCell: ({ row }: GridRenderCellParams<T>) => (
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
        width: canDeactivateCatalog ? 90 : 50,
        sortable: false,
        renderCell: ({ row }: GridRenderCellParams<T>) => (
          <Box display="flex" gap={0.25}>
            <Tooltip title="Edit" arrow>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditing(row); setDialogOpen(true) }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDeactivateCatalog && row.is_active && (
              <Tooltip title="Deactivate" arrow>
                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeactivateTarget(row) }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [canDeactivateCatalog, config.extraColumns],
  )

  return (
    <Box>
      <ResponsiveStack spacing={1.5} mb={2}>
        <SearchTextField
          placeholder={`Search ${config.entityLabelPlural.toLowerCase()}…`}
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
          Add {config.entityLabel.toLowerCase()}
        </Button>
      </ResponsiveStack>

      <AppDataGrid rows={rows} columns={columns} loading={isLoading} pageSizeOptions={[25, 50]} />

      <CatalogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        existing={editing}
        config={config}
      />

      <DeactivateConfirmModal
        open={!!deactivateTarget}
        title={`Deactivate ${config.entityLabel.toLowerCase()}?`}
        displayName={deactivateTarget?.name ?? ''}
        warning={`The ${config.entityLabel.toLowerCase()} will be hidden from new product assignments. Existing products keep their link until changed.`}
        isPending={deactivate.isPending}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (!deactivateTarget) return
          deactivate.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) })
        }}
      />
    </Box>
  )
}
