import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { categorySchema, type CategoryFormValues } from '@/lib/zod-schemas/catalog.schemas'
import { useCreateCategory, useUpdateCategory } from '@/hooks/categories/useCategoryMutations'
import type { Category } from '@/types/database.types'

interface Props {
  open: boolean
  onClose: () => void
  existing?: Category
}

export function CategoryForm({ open, onClose, existing }: Props) {
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: existing
      ? { name: existing.name, description: existing.description }
      : { name: '', description: null },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name,
      description: values.description || null,
    }
    if (existing) {
      await updateCategory.mutateAsync({ id: existing.id, data: payload })
    } else {
      await createCategory.mutateAsync(payload)
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{existing ? 'Edit category' : 'Add category'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name *"
                size="small"
                fullWidth
                margin="normal"
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label="Description"
                size="small"
                fullWidth
                margin="normal"
                multiline
                minRows={2}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {existing ? 'Save changes' : 'Create category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
