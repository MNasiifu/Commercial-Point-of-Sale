import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, TextField, Typography,
} from '@mui/material'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

import { voidSaleSchema, type VoidSaleFormValues } from '@/lib/zod-schemas/return.schemas'
import { useVoidSale } from '@/hooks/sales/useSaleMutations'

interface Props {
  open:        boolean
  saleId:      string
  saleNumber:  string
  onClose:     () => void
  onVoided?:   () => void
}

export function VoidSaleDialog({ open, saleId, saleNumber, onClose, onVoided }: Props) {
  const voidSale = useVoidSale()

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<VoidSaleFormValues>({ resolver: zodResolver(voidSaleSchema) })

  const handleClose = () => { reset(); onClose() }

  const onSubmit = async (values: VoidSaleFormValues) => {
    await voidSale.mutateAsync({ saleId, reason: values.reason })
    reset()
    onVoided?.()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="error" />
        Void Sale
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            You are about to void sale{' '}
            <strong style={{ fontFamily: 'monospace' }}>{saleNumber}</strong>.
            This will mark the sale as cancelled and restore stock quantities.
            This action cannot be undone.
          </Typography>

          <TextField
            {...register('reason')}
            label="Reason for voiding"
            multiline
            minRows={2}
            fullWidth
            size="small"
            error={!!errors.reason}
            helperText={errors.reason?.message}
            placeholder="e.g. Incorrect item entered, customer cancelled…"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={voidSale.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="error"
            disabled={voidSale.isPending}
            startIcon={voidSale.isPending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Void Sale
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
