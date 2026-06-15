import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CatalogManager, type CatalogManagerConfig } from '@/components/organisms/CatalogManager/CatalogManager'
import { garmentTypeHooks } from '@/hooks/catalog/useCatalog'
import { garmentTypeSchema, type GarmentTypeFormValues } from '@/lib/zod-schemas/catalog.schemas'
import type { GarmentType } from '@/types/database.types'

const config: CatalogManagerConfig<GarmentType, GarmentTypeFormValues> = {
  entityLabel: 'Garment type',
  entityLabelPlural: 'Garment types',
  useList: garmentTypeHooks.useList,
  useCreate: garmentTypeHooks.useCreate,
  useUpdate: garmentTypeHooks.useUpdate,
  useDeactivate: garmentTypeHooks.useDeactivate,
  schema: garmentTypeSchema,
  buildDefaults: (e) => ({ name: e?.name ?? '', description: e?.description ?? null }),
  toPayload: (v) => ({ name: v.name, description: v.description || null }),
  renderFields: (control, errors) => (
    <>
      <Controller name="name" control={control} render={({ field }) => (
        <TextField {...field} label="Name *" size="small" fullWidth margin="normal"
          placeholder="e.g. Shorts, T-Shirt, Dress"
          error={!!errors.name} helperText={errors.name?.message} />
      )} />
      <Controller name="description" control={control} render={({ field }) => (
        <TextField {...field} value={field.value ?? ''} label="Description" size="small"
          fullWidth margin="normal" multiline minRows={2} />
      )} />
    </>
  ),
}

export function GarmentTypesPage() {
  return (
    <DashboardTemplate>
      <CatalogManager config={config} />
    </DashboardTemplate>
  )
}
