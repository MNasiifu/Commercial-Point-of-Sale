import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Chip, Divider, FormControl, FormHelperText,
  Grid, IconButton, InputAdornment, InputLabel, MenuItem,
  Select, Stack, Tab, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon       from '@mui/icons-material/Add'
import DeleteIcon    from '@mui/icons-material/Delete'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useForm, Controller, type Control, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  productSchema, GENDER_OPTIONS, type ProductFormValues,
} from '@/lib/zod-schemas/product.schemas'
import { useCreateProduct, useUpdateProduct } from '@/hooks/products/useProductMutations'
import {
  useCategories, useBrands, useColors, useGarmentTypes, useSizes, useCountries,
} from '@/hooks/shared/useReferenceData'
import { BarcodeManager } from '@/components/organisms/BarcodeManager/BarcodeManager'
import type { ProductWithDetails } from '@/services/productService'

// ─── Shared field set (used by create + edit) ─────────────────

function ProductFields({
  control, errors,
}: {
  control: Control<ProductFormValues>
  errors:  FieldErrors<ProductFormValues>
}) {
  const { data: categories   = [] } = useCategories()
  const { data: brands       = [] } = useBrands()
  const { data: colors       = [] } = useColors()
  const { data: garmentTypes = [] } = useGarmentTypes()
  const { data: sizes        = [] } = useSizes()
  const { data: countries    = [] } = useCountries()

  return (
    <Grid container spacing={2.5}>
      {/* Name + Category */}
      <Grid item xs={12} md={6}>
        <Controller name="name" control={control} render={({ field }) => (
          <TextField {...field} label="Product name *" size="small" fullWidth
            error={!!errors.name} helperText={errors.name?.message} />
        )} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Controller name="category_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth error={!!errors.category_id}>
            <InputLabel>Category *</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Category *">
              <MenuItem value=""><em>Select a category</em></MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
            <FormHelperText>{errors.category_id?.message ?? 'Required'}</FormHelperText>
          </FormControl>
        )} />
      </Grid>

      {/* Brand + Garment type */}
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="brand_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Brand</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Brand">
              <MenuItem value=""><em>None</em></MenuItem>
              {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="garment_type_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Type</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Type">
              <MenuItem value=""><em>None</em></MenuItem>
              {garmentTypes.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>

      {/* Size + Color */}
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="size_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Size</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Size">
              <MenuItem value=""><em>None</em></MenuItem>
              {sizes.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="color_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Color</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Color">
              <MenuItem value=""><em>None</em></MenuItem>
              {colors.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box component="span" display="inline-flex" alignItems="center" gap={1}>
                    {c.hex_code && (
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex_code,
                                 border: '1px solid rgba(0,0,0,0.2)' }} />
                    )}
                    {c.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )} />
      </Grid>

      {/* Gender + Country of origin */}
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="gender" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Gender</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Gender">
              <MenuItem value=""><em>None</em></MenuItem>
              {GENDER_OPTIONS.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="country_id" control={control} render={({ field }) => (
          <FormControl size="small" fullWidth>
            <InputLabel>Country of origin</InputLabel>
            <Select {...field} value={field.value ?? ''} label="Country of origin">
              <MenuItem value=""><em>None</em></MenuItem>
              {countries.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        )} />
      </Grid>

      {/* Age + Store location */}
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="age_text" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label="Age" size="small" fullWidth
            placeholder="e.g. 3-6 months" helperText="Free text age range" />
        )} />
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="store_location" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label="Product location" size="small" fullWidth
            placeholder="e.g. Rack B3" helperText="Where it sits in the shop" />
        )} />
      </Grid>

      {/* Sold in (pack size) */}
      <Grid item xs={12} sm={6} md={4}>
        <Controller name="pack_size" control={control} render={({ field }) => (
          <TextField
            {...field}
            label="Sold in (pieces per pack)"
            type="number"
            size="small"
            fullWidth
            inputProps={{ min: 1, step: 1 }}
            error={!!errors.pack_size}
            helperText={errors.pack_size?.message ?? '1 = single item; 2 = sold as a 2-piece set'}
            onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
          />
        )} />
      </Grid>

      {/* Pricing */}
      <Grid item xs={12}>
        <Divider textAlign="left" sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Pricing (UGX, per pack)</Typography>
        </Divider>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller name="cost_price" control={control} render={({ field }) => (
          <TextField {...field} label="Cost price" type="number" size="small" fullWidth
            inputProps={{ min: 0, step: 100 }}
            InputProps={{ startAdornment: <InputAdornment position="start">UGX</InputAdornment> }}
            error={!!errors.cost_price} helperText={errors.cost_price?.message ?? 'For profit reports'}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
        )} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller name="retail_price" control={control} render={({ field }) => (
          <TextField {...field} label="Retail price *" type="number" size="small" fullWidth
            inputProps={{ min: 0, step: 100 }}
            InputProps={{ startAdornment: <InputAdornment position="start">UGX</InputAdornment> }}
            error={!!errors.retail_price} helperText={errors.retail_price?.message ?? 'Normal price'}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
        )} />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Controller name="wholesale_price" control={control} render={({ field }) => (
          <TextField {...field} label="Wholesale price" type="number" size="small" fullWidth
            inputProps={{ min: 0, step: 100 }}
            InputProps={{ startAdornment: <InputAdornment position="start">UGX</InputAdornment> }}
            error={!!errors.wholesale_price}
            helperText={errors.wholesale_price?.message ?? 'Auto-applied at 6+ packs'}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
        )} />
      </Grid>

      {/* Description */}
      <Grid item xs={12}>
        <Controller name="description" control={control} render={({ field }) => (
          <TextField {...field} value={field.value ?? ''} label="Description / notes"
            size="small" fullWidth multiline rows={2} />
        )} />
      </Grid>
    </Grid>
  )
}

// ─── Barcode list editor (create mode) ────────────────────────

function BarcodeListEditor({
  barcodes, onChange,
}: {
  barcodes: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <Stack spacing={1.5}>
      {barcodes.map((bc, i) => (
        <Box key={i} display="flex" gap={1} alignItems="center">
          <TextField
            label={`Barcode ${i + 1}`}
            size="small"
            value={bc}
            placeholder="Type or scan"
            sx={{ flex: 1 }}
            onChange={(e) => {
              const next = [...barcodes]; next[i] = e.target.value; onChange(next)
            }}
          />
          <IconButton size="small" color="error" onClick={() => onChange(barcodes.filter((_, j) => j !== i))}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      <Button variant="outlined" size="small" startIcon={<AddIcon />}
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => onChange([...barcodes, ''])}>
        Add barcode
      </Button>
      {barcodes.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No barcodes added. You can also add them after saving.
        </Typography>
      )}
    </Stack>
  )
}

// ─── Tab panel helper ─────────────────────────────────────────

function TabPanel({ value, index, children }: { value: number; index: number; children: React.ReactNode }) {
  return value === index ? <Box pt={3}>{children}</Box> : null
}

const EMPTY_PRODUCT: ProductFormValues = {
  name: '', category_id: '', brand_id: null, garment_type_id: null,
  size_id: null, color_id: null, country_id: null, gender: null,
  age_text: null, store_location: null, pack_size: 1,
  cost_price: 0, retail_price: 0, wholesale_price: 0, description: null,
}

// ─── CREATE ───────────────────────────────────────────────────

function CreateProductForm() {
  const navigate   = useNavigate()
  const createProd = useCreateProduct()
  const [tab, setTab] = useState(0)
  const [barcodes, setBarcodes] = useState<string[]>([])

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: EMPTY_PRODUCT,
    })

  const onSubmit = async (values: ProductFormValues) => {
    const cleanBarcodes = barcodes.filter(Boolean).map((b) => ({ barcode: b, is_generated: false }))
    await createProd.mutateAsync([
      {
        ...values,
        brand_id:        values.brand_id        || null,
        garment_type_id: values.garment_type_id || null,
        size_id:         values.size_id         || null,
        color_id:        values.color_id        || null,
        country_id:      values.country_id      || null,
        gender:          values.gender          || null,
        age_text:        values.age_text        || null,
        store_location:  values.store_location  || null,
        description:     values.description      || null,
        is_active:  true,
        created_by: null,
        image_url:  null,
      },
      cleanBarcodes,
    ])
    navigate('/products')
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Product details" />
          <Tab label="Barcodes" />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <ProductFields control={control} errors={errors} />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <BarcodeListEditor barcodes={barcodes} onChange={setBarcodes} />
      </TabPanel>

      <Divider sx={{ my: 3 }} />
      <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
        <Button variant="outlined" onClick={() => navigate('/products')} disabled={isSubmitting}>Cancel</Button>
        <Button variant="contained" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Create product'}
        </Button>
      </Stack>
    </Box>
  )
}

// ─── EDIT ─────────────────────────────────────────────────────

function EditProductForm({ product }: { product: ProductWithDetails }) {
  const navigate   = useNavigate()
  const updateProd = useUpdateProduct()
  const [tab, setTab] = useState(0)

  const { control, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ProductFormValues>({
      resolver: zodResolver(productSchema),
      defaultValues: {
        name:            product.name,
        category_id:     product.category_id,
        brand_id:        product.brand_id,
        garment_type_id: product.garment_type_id,
        size_id:         product.size_id,
        color_id:        product.color_id,
        country_id:      product.country_id,
        gender:          product.gender,
        age_text:        product.age_text,
        store_location:  product.store_location,
        pack_size:       product.pack_size,
        cost_price:      product.cost_price,
        retail_price:    product.retail_price,
        wholesale_price: product.wholesale_price,
        description:     product.description,
      },
    })

  const onSubmit = async (values: ProductFormValues) => {
    await updateProd.mutateAsync({
      id: product.id,
      data: {
        ...values,
        brand_id:        values.brand_id        || null,
        garment_type_id: values.garment_type_id || null,
        size_id:         values.size_id         || null,
        color_id:        values.color_id        || null,
        country_id:      values.country_id      || null,
        gender:          values.gender          || null,
        age_text:        values.age_text        || null,
        store_location:  values.store_location  || null,
        description:     values.description      || null,
      },
    })
    navigate(`/products/${product.id}`)
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Product details" />
          <Tab label={`Barcodes (${product.product_barcodes.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tab} index={0}>
        <ProductFields control={control} errors={errors} />
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
          <Button variant="outlined" onClick={() => navigate(`/products/${product.id}`)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save changes'}
          </Button>
        </Stack>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <BarcodeManager
          productId={product.id}
          barcodes={product.product_barcodes as import('@/types/database.types').ProductBarcode[]}
          productName={product.name}
        />
      </TabPanel>
    </Box>
  )
}

// ─── Public entry point ───────────────────────────────────────

interface Props {
  product?: ProductWithDetails
}

export function ProductForm({ product }: Props) {
  const navigate = useNavigate()

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={3}>
        <Tooltip title={product ? 'Back to product details' : 'Back to products'} arrow>
          <IconButton size="small" onClick={() => navigate(product ? `/products/${product.id}` : '/products')}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {product ? product.name : 'New product'}
          </Typography>
        </Box>
        {product && (
          <Chip
            label={product.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={product.is_active ? 'success' : 'default'}
            variant={product.is_active ? 'filled' : 'outlined'}
            sx={{ borderRadius: '6px', ml: 'auto' }}
          />
        )}
      </Box>

      {product ? <EditProductForm product={product} /> : <CreateProductForm />}
    </Box>
  )
}
