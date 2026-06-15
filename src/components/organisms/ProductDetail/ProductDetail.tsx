import {
  Alert, Box, Button, Chip, CircularProgress, Divider, Grid, IconButton,
  Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow,
  Tooltip, Typography,
} from '@mui/material'
import ArrowBackIcon   from '@mui/icons-material/ArrowBack'
import EditIcon        from '@mui/icons-material/Edit'
import DeleteIcon      from '@mui/icons-material/Delete'
import ToggleOnIcon    from '@mui/icons-material/ToggleOn'
import ToggleOffIcon   from '@mui/icons-material/ToggleOff'
import CategoryIcon    from '@mui/icons-material/Category'
import StyleIcon       from '@mui/icons-material/Style'
import StraightenIcon  from '@mui/icons-material/Straighten'
import PaletteIcon     from '@mui/icons-material/Palette'
import LocalOfferIcon  from '@mui/icons-material/LocalOffer'
import PublicIcon      from '@mui/icons-material/Public'
import WcIcon          from '@mui/icons-material/Wc'
import ChildCareIcon   from '@mui/icons-material/ChildCare'
import PlaceIcon       from '@mui/icons-material/Place'
import Inventory2Icon  from '@mui/icons-material/Inventory2'
import DescriptionIcon from '@mui/icons-material/Description'
import QrCodeIcon      from '@mui/icons-material/QrCode'

import { useProductDetail } from '@/hooks/products/useProductDetail'
import { DeleteProductModal } from '@/components/organisms/ProductTable/DeleteProductModal'
import { ToggleProductModal } from '@/components/organisms/ProductTable/ToggleProductModal'
import { formatUGX, formatDateTime } from '@/lib/formatters'

const GENDER_LABEL: Record<string, string> = {
  boy: 'Boy', girl: 'Girl', unisex: 'Unisex', newborn: 'Newborn',
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <Box display="flex" alignItems="flex-start" gap={1.5} py={1}>
      <Box sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box flex={1} minWidth={0}>
        <Typography variant="caption" color="text.secondary" lineHeight={1.2}>{label}</Typography>
        <Typography variant="body2" fontWeight={500} lineHeight={1.4}>{value || '—'}</Typography>
      </Box>
    </Box>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Typography variant="subtitle2" fontWeight={700} sx={{ px: 2.5, pt: 2, pb: 1 }}>{title}</Typography>
}

function PriceRow({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="body2" fontWeight={strong ? 700 : 500}>{label}</Typography>
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2" fontFamily="monospace" fontWeight={strong ? 700 : 500}
          color={strong ? 'primary.main' : 'text.primary'}>
          {formatUGX(value)}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

export function ProductDetail() {
  const {
    product, isLoading, isError, modal, toggleActive, deleteProduct,
    goBack, goEdit, handleRequestToggle, handleRequestDelete,
    handleClose, handleConfirmDelete, handleConfirmToggle,
  } = useProductDetail()

  if (isLoading) {
    return <Box display="flex" justifyContent="center" alignItems="center" py={10}><CircularProgress /></Box>
  }

  if (isError || !product) {
    return (
      <Box>
        <IconButton size="small" onClick={goBack} sx={{ mb: 2 }}><ArrowBackIcon /></IconButton>
        <Alert severity="error" sx={{ borderRadius: 2 }}>Product not found or failed to load.</Alert>
      </Box>
    )
  }

  const color = product.colors

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5} mb={3} flexWrap="wrap">
        <Tooltip title="Back to products" arrow>
          <IconButton size="small" onClick={goBack}><ArrowBackIcon /></IconButton>
        </Tooltip>
        <Box flex={1} minWidth={0}>
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700} noWrap sx={{ maxWidth: '100%' }}>{product.name}</Typography>
            <Chip label={product.is_active ? 'Active' : 'Inactive'} size="small"
              color={product.is_active ? 'success' : 'default'}
              variant={product.is_active ? 'filled' : 'outlined'}
              sx={{ borderRadius: '6px', fontSize: '0.75rem' }} />
            {product.pack_size > 1 && (
              <Chip label={`Sold in ${product.pack_size}-pack`} size="small" color="info" variant="outlined"
                sx={{ borderRadius: '6px', fontSize: '0.7rem' }} />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            {[product.brands?.name, product.sizes?.name, color?.name].filter(Boolean).join(' · ') || '—'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexShrink={0}>
          <Button variant="contained" size="small" startIcon={<EditIcon />} onClick={goEdit}>Edit</Button>
          <Button variant="outlined" size="small" color={product.is_active ? 'warning' : 'success'}
            startIcon={product.is_active ? <ToggleOffIcon /> : <ToggleOnIcon />}
            onClick={() => handleRequestToggle(product)}>
            {product.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="outlined" size="small" color="error" startIcon={<DeleteIcon />}
            onClick={() => handleRequestDelete(product)}>Delete</Button>
        </Stack>
      </Box>

      <Grid container spacing={2.5}>
        {/* Left: product attributes */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
            <SectionHeader title="Product Information" />
            <Divider />
            <Box px={2.5} pb={2}>
              <InfoRow icon={<CategoryIcon fontSize="small" />} label="Category" value={product.categories?.name} />
              <InfoRow icon={<LocalOfferIcon fontSize="small" />} label="Brand" value={product.brands?.name} />
              <InfoRow icon={<StyleIcon fontSize="small" />} label="Type" value={product.garment_types?.name} />
              <InfoRow icon={<StraightenIcon fontSize="small" />} label="Size" value={product.sizes?.name} />
              <InfoRow icon={<PaletteIcon fontSize="small" />} label="Color"
                value={color ? (
                  <Box component="span" display="inline-flex" alignItems="center" gap={1}>
                    {color.hex_code && (
                      <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color.hex_code,
                                 border: '1px solid rgba(0,0,0,0.2)' }} />
                    )}
                    {color.name}
                  </Box>
                ) : null} />
              <InfoRow icon={<WcIcon fontSize="small" />} label="Gender"
                value={product.gender ? GENDER_LABEL[product.gender] : null} />
              <InfoRow icon={<ChildCareIcon fontSize="small" />} label="Age" value={product.age_text} />
              <InfoRow icon={<PublicIcon fontSize="small" />} label="Country of Origin" value={product.countries?.name} />
              <InfoRow icon={<PlaceIcon fontSize="small" />} label="Product location" value={product.store_location} />
              <InfoRow icon={<Inventory2Icon fontSize="small" />} label="Sold in"
                value={`${product.pack_size} piece${product.pack_size > 1 ? 's' : ''} per pack`} />
              {product.description && (
                <InfoRow icon={<DescriptionIcon fontSize="small" />} label="Description" value={product.description} />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: pricing + barcodes */}
        <Grid item xs={12} md={7}>
          <Stack spacing={2.5}>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <SectionHeader title="Pricing" />
              <Divider />
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <PriceRow label="Cost price" value={product.cost_price} />
                    <PriceRow label="Retail price" value={product.retail_price} strong />
                    <PriceRow label="Wholesale price (6+ packs)" value={product.wholesale_price} />
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider />
              <Box px={2.5} py={1.25} sx={{ bgcolor: 'action.hover' }}>
                <Typography variant="caption" color="text.secondary">
                  Wholesale price is charged automatically when a customer buys 6 or more packs of this product.
                </Typography>
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <SectionHeader title="Barcodes" />
              <Divider />
              {product.product_barcodes && product.product_barcodes.length > 0 ? (
                <Box px={2.5} py={1.5}>
                  <Stack spacing={1}>
                    {product.product_barcodes.map((bc) => (
                      <Box key={bc.id} display="flex" alignItems="center" gap={1.5} px={1.5} py={1}
                        sx={{ bgcolor: 'action.hover', borderRadius: 1.5 }}>
                        <QrCodeIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={600} fontFamily="monospace" flex={1}>{bc.barcode}</Typography>
                        <Chip label={bc.is_generated ? 'Generated' : 'Manual'} size="small" variant="outlined"
                          color={bc.is_generated ? 'info' : 'default'} sx={{ borderRadius: '6px', fontSize: '0.7rem' }} />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Box px={2.5} py={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">No barcodes assigned to this product.</Typography>
                </Box>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Footer metadata */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ borderRadius: 2, px: 2.5, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Created</Typography>
              <Typography variant="body2">{formatDateTime(product.created_at)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Last Updated</Typography>
              <Typography variant="body2">{formatDateTime(product.updated_at)}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Product ID</Typography>
              <Typography variant="body2" fontFamily="monospace" fontSize="0.75rem">{product.id}</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <DeleteProductModal
        open={modal.kind === 'delete'}
        product={modal.kind === 'delete' ? modal.product : null}
        isPending={deleteProduct.isPending}
        onConfirm={handleConfirmDelete}
        onClose={handleClose}
      />
      <ToggleProductModal
        open={modal.kind === 'toggle'}
        product={modal.kind === 'toggle' ? modal.product : null}
        isPending={toggleActive.isPending}
        onConfirm={handleConfirmToggle}
        onClose={handleClose}
      />
    </Box>
  )
}
