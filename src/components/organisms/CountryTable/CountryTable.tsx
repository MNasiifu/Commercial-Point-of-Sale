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
import { useCountriesList } from '@/hooks/countries/useCountries'
import { useDeactivateCountry } from '@/hooks/countries/useCountryMutations'
import { usePermissions } from '@/hooks/auth/usePermissions'
import { CountryForm } from '@/components/organisms/CountryForm/CountryForm'
import { DeactivateConfirmModal } from '@/components/molecules/DeactivateConfirmModal/DeactivateConfirmModal'
import { SearchTextField } from '@/components/molecules/SearchTextField'
import { ResponsiveStack, responsiveWidth } from '@/components/molecules/ResponsiveStack'
import type { Country } from '@/types/database.types'

export function CountryTable() {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Country | undefined>()
  const [deactivateTarget, setDeactivateTarget] = useState<Country | null>(null)

  const { canDeactivateCatalog } = usePermissions()
  const { data: countries = [], isLoading } = useCountriesList({ search, showInactive })
  const deactivate = useDeactivateCountry()

  const columns: GridColDef<Country>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: 'Name',
        flex: 1.5,
        minWidth: 180,
        renderCell: ({ row }: GridRenderCellParams<Country>) => (
          <Typography variant="body2" fontWeight={600}>
            {row.name}
          </Typography>
        ),
      },
      {
        field: 'code',
        headerName: 'Code',
        width: 80,
        renderCell: ({ value }: GridRenderCellParams) => (
          <Typography variant="body2" color={value ? 'text.primary' : 'text.disabled'}>
            {value ?? '—'}
          </Typography>
        ),
      },
      {
        field: 'is_active',
        headerName: 'Status',
        width: 90,
        renderCell: ({ row }: GridRenderCellParams<Country>) => (
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
        renderCell: ({ row }: GridRenderCellParams<Country>) => (
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
          placeholder="Search countries…"
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
          Add country
        </Button>
      </ResponsiveStack>

      <AppDataGrid rows={countries} columns={columns} loading={isLoading} pageSizeOptions={[25, 50]} />

      <CountryForm open={dialogOpen} onClose={() => setDialogOpen(false)} existing={editing} />

      <DeactivateConfirmModal
        open={!!deactivateTarget}
        title="Deactivate country?"
        displayName={deactivateTarget?.name ?? ''}
        subtitle={deactivateTarget?.code}
        warning="The country will be hidden from dropdowns. Linked manufacturers and products are not removed."
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
