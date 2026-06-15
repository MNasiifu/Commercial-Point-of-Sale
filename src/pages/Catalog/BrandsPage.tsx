import { Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { CatalogManager, type CatalogManagerConfig } from '@/components/organisms/CatalogManager/CatalogManager'
import { brandHooks } from '@/hooks/catalog/useCatalog'
import { brandSchema, type BrandFormValues } from '@/lib/zod-schemas/catalog.schemas'
import type { Brand } from '@/types/database.types'

const config: CatalogManagerConfig<Brand, BrandFormValues> = {
  entityLabel: 'Brand',
  entityLabelPlural: 'Brands',
  useList: brandHooks.useList,
  useCreate: brandHooks.useCreate,
  useUpdate: brandHooks.useUpdate,
  useDeactivate: brandHooks.useDeactivate,
  schema: brandSchema,
  buildDefaults: (e) => ({ name: e?.name ?? '', description: e?.description ?? null }),
  toPayload: (v) => ({ name: v.name, description: v.description || null }),
  renderFields: (control, errors) => (
    <>
      <Controller name="name" control={control} render={({ field }) => (
        <TextField {...field} label="Name *" size="small" fullWidth margin="normal"
          error={!!errors.name} helperText={errors.name?.message} />
      )} />
      <Controller name="description" control={control} render={({ field }) => (
        <TextField {...field} value={field.value ?? ''} label="Description" size="small"
          fullWidth margin="normal" multiline minRows={2} />
      )} />
    </>
  ),
}

export function BrandsPage() {
  return (
    <DashboardTemplate>
      <CatalogManager config={config} />
    </DashboardTemplate>
  )
}
