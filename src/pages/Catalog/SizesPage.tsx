import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { type GridColDef } from '@mui/x-data-grid'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CatalogManager, type CatalogManagerConfig } from '@/components/organisms/CatalogManager/CatalogManager'
import { sizeHooks } from '@/hooks/catalog/useCatalog'
import { sizeSchema, type SizeFormValues } from '@/lib/zod-schemas/catalog.schemas'
import type { Size } from '@/types/database.types'

const orderColumn: GridColDef<Size> = {
  field: 'sort_order',
  headerName: 'Order',
  width: 100,
}

const config: CatalogManagerConfig<Size, SizeFormValues> = {
  entityLabel: 'Size',
  entityLabelPlural: 'Sizes',
  useList: sizeHooks.useList,
  useCreate: sizeHooks.useCreate,
  useUpdate: sizeHooks.useUpdate,
  useDeactivate: sizeHooks.useDeactivate,
  schema: sizeSchema,
  extraColumns: [orderColumn],
  buildDefaults: (e) => ({ name: e?.name ?? '', sort_order: e?.sort_order ?? 0 }),
  toPayload: (v) => ({ name: v.name, sort_order: v.sort_order }),
  renderFields: (control, errors) => (
    <>
      <Controller name="name" control={control} render={({ field }) => (
        <TextField {...field} label="Name *" size="small" fullWidth margin="normal"
          placeholder="e.g. 3-6M, 2-3Y, S"
          error={!!errors.name} helperText={errors.name?.message} />
      )} />
      <Controller name="sort_order" control={control} render={({ field }) => (
        <TextField {...field} label="Display order" type="number" size="small" fullWidth margin="normal"
          inputProps={{ min: 0, step: 10 }}
          error={!!errors.sort_order}
          helperText={errors.sort_order?.message ?? 'Lower numbers appear first (e.g. 0-3M before 3-6M)'}
          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)} />
      )} />
    </>
  ),
}

export function SizesPage() {
  return (
    <DashboardTemplate>
      <CatalogManager config={config} />
    </DashboardTemplate>
  )
}
