import { useParams } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'

import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'
import { ProductForm }       from '@/components/organisms/ProductForm/ProductForm'
import { useProduct }        from '@/hooks/products/useProducts'

function EditLoader({ id }: { id: string }) {
  const { data: product, isLoading, isError } = useProduct(id)

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <CircularProgress />
      </Box>
    )
  }

  if (isError || !product) {
    return (
      <Box py={8} textAlign="center">
        <Typography variant="h6" color="text.secondary">Product not found.</Typography>
      </Box>
    )
  }

  return <ProductForm product={product} />
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isNew  = !id || id === 'new'

  return (
    <DashboardTemplate>
      {isNew ? <ProductForm /> : <EditLoader id={id} />}
    </DashboardTemplate>
  )
}
