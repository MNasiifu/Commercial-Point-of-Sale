import { Controller } from 'react-hook-form'
import { Box, InputAdornment, TextField, Typography } from '@mui/material'
import { type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CatalogManager, type CatalogManagerConfig } from '@/components/organisms/CatalogManager/CatalogManager'
import { colorHooks } from '@/hooks/catalog/useCatalog'
import { colorSchema, type ColorFormValues } from '@/lib/zod-schemas/catalog.schemas'
import type { Color } from '@/types/database.types'

const swatchColumn: GridColDef<Color> = {
  field: 'hex_code',
  headerName: 'Swatch',
  width: 120,
  sortable: false,
  renderCell: ({ row }: GridRenderCellParams<Color>) => (
    <Box display="flex" alignItems="center" gap={1}>
      <Box sx={{
        width: 18, height: 18, borderRadius: '50%',
        bgcolor: row.hex_code || 'transparent',
        border: '1px solid rgba(0,0,0,0.25)',
      }} />
      <Typography variant="caption" color="text.secondary">{row.hex_code ?? '—'}</Typography>
    </Box>
  ),
}

const config: CatalogManagerConfig<Color, ColorFormValues> = {
  entityLabel: 'Color',
  entityLabelPlural: 'Colors',
  useList: colorHooks.useList,
  useCreate: colorHooks.useCreate,
  useUpdate: colorHooks.useUpdate,
  useDeactivate: colorHooks.useDeactivate,
  schema: colorSchema,
  extraColumns: [swatchColumn],
  buildDefaults: (e) => ({ name: e?.name ?? '', hex_code: e?.hex_code ?? '' }),
  toPayload: (v) => ({ name: v.name, hex_code: v.hex_code || null }),
  renderFields: (control, errors) => (
    <>
      <Controller name="name" control={control} render={({ field }) => (
        <TextField {...field} label="Name *" size="small" fullWidth margin="normal"
          error={!!errors.name} helperText={errors.name?.message} />
      )} />
      <Controller name="hex_code" control={control} render={({ field }) => (
        <TextField {...field} value={field.value ?? ''} label="Hex colour" size="small"
          fullWidth margin="normal" placeholder="#FF8800"
          error={!!errors.hex_code} helperText={errors.hex_code?.message ?? 'Optional swatch colour'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Box sx={{
                  width: 18, height: 18, borderRadius: '50%',
                  bgcolor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(field.value ?? '') ? field.value! : 'transparent',
                  border: '1px solid rgba(0,0,0,0.25)',
                }} />
              </InputAdornment>
            ),
          }} />
      )} />
    </>
  ),
}

export function ColorsPage() {
  return (
    <DashboardTemplate>
      <CatalogManager config={config} />
    </DashboardTemplate>
  )
}
