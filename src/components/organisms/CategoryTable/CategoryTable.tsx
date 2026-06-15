import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip,
  Typography,
} from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/molecules/AppDataGrid'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import { useCategories } from '@/hooks/categories/useCategories'
import { useDeactivateCategory } from '@/hooks/categories/useCategoryMutations'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { CategoryForm } from '@/components/organisms/CategoryForm/CategoryForm'
import { DeactivateConfirmModal } from '@/components/molecules/DeactivateConfirmModal/DeactivateConfirmModal'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import { ResponsiveStack, responsiveWidth } from '@/components/molecules/ResponsiveStack'
import { formatDate } from '@/lib/formatters'
import type { Category } from '@/types/database.types'

export function CategoryTable() {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Category | undefined>()
  const [deactivateTarget, setDeactivateTarget] = useState<Category | null>(null)

  const { canDeactivateCatalog } = usePermissions()
  const { data: categories = [], isLoading } = useCategories({ search, showInactive })
  const deactivate = useDeactivateCategory()

  const columns: GridColDef<Category>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }: GridRenderCellParams<Category>) => (
          <Box py={0.5}>
            <Typography variant="body2" fontWeight={600}>
              {row.name}
            </Typography>
            {row.description && (
              <Typography variant="caption" color="text.secondary" display="block">
                {row.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'created_at',
        headerName: 'Created',
        width: 120,
        valueFormatter: (v: string) => formatDate(v),
      },
      {
        field: 'is_active',
        headerName: 'Status',
        width: 90,
        renderCell: ({ row }: GridRenderCellParams<Category>) => (
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
        renderCell: ({ row }: GridRenderCellParams<Category>) => (
          <Box display="flex" gap={0.25}>
            <Tooltip title="Edit" arrow>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditing(row)
                  setDialogOpen(true)
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canDeactivateCatalog && row.is_active && (
              <Tooltip title="Deactivate" arrow>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeactivateTarget(row)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [canDeactivateCatalog],
  )

  return (
    <Box>
      <ResponsiveStack spacing={1.5} mb={2}>
        <SearchTextField
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ ...responsiveWidth(), flex: 1, maxWidth: { sm: 380 } }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2">Show inactive</Typography>}
          sx={responsiveWidth()}
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(undefined)
            setDialogOpen(true)
          }}
          sx={{ ...responsiveWidth(), whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          Add category
        </Button>
      </ResponsiveStack>

      <AppDataGrid rows={categories} columns={columns} loading={isLoading} pageSizeOptions={[25, 50]} />

      <CategoryForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} />

      <DeactivateConfirmModal
        open={!!deactivateTarget}
        title="Deactivate category?"
        displayName={deactivateTarget?.name ?? ''}
        subtitle={deactivateTarget?.description}
        warning="The category will be hidden from new product assignments. Existing products keep their link until changed."
        isPending={deactivate.isPending}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (!deactivateTarget) return
          deactivate.mutate(deactivateTarget.id, {
            onSuccess: () => setDeactivateTarget(null),
          })
        }}
      />
    </Box>
  )
}
