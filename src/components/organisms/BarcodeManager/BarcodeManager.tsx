import { useEffect, useRef, useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, IconButton, Stack, TextField, Tooltip, Typography,
} from '@mui/material'
import AddIcon      from '@mui/icons-material/Add'
import DeleteIcon   from '@mui/icons-material/Delete'
import QrCodeIcon   from '@mui/icons-material/QrCode'
import CropFreeIcon from '@mui/icons-material/CropFree'

import { BarcodeDisplay } from '@/components/molecules/BarcodeDisplay/BarcodeDisplay'
import { DeleteConfirmationModal } from '@/components/molecules/DeleteConfirmationModal/DeleteConfirmationModal'
import { useAddBarcode, useDeleteBarcode } from '@/hooks/products/useProductMutations'
import { generateBarcodeValue } from '@/lib/barcode'
import type { ProductBarcode } from '@/types/database.types'

interface Props {
  productId: string
  barcodes:  ProductBarcode[]
  productName?: string
}

interface AddDialogProps {
  open:        boolean
  onClose:     () => void
  productId:   string
  productName?: string
}

function AddBarcodeDialog({ open, onClose, productId, productName }: AddDialogProps) {
  const [value, setValue]   = useState('')
  const [error, setError]   = useState('')
  const inputRef            = useRef<HTMLInputElement>(null)
  const addBarcode          = useAddBarcode()

  useEffect(() => {
    if (open) {
      setValue('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const validate = (v: string) => {
    if (!v.trim()) return 'Barcode value is required'
    if (v.trim().length < 4) return 'Barcode must be at least 4 characters'
    return ''
  }

  const handleSubmit = async () => {
    const err = validate(value)
    if (err) { setError(err); return }
    await addBarcode.mutateAsync({ productId, barcode: value.trim(), isGenerated: false })
    onClose()
  }

  const handleGenerate = async () => {
    const generated = generateBarcodeValue()
    await addBarcode.mutateAsync({ productId, barcode: generated, isGenerated: true })
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Barcode</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            inputRef={inputRef}
            label="Barcode value"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit()
            }}
            size="small"
            fullWidth
            error={!!error}
            helperText={error || 'Type or scan with USB barcode scanner — press Enter to confirm'}
            InputProps={{
              startAdornment: (
                <CropFreeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
              ),
            }}
          />

          {value.trim().length >= 4 && (
            <Box display="flex" justifyContent="center">
              <BarcodeDisplay value={value.trim()} label={productName} showValue compact />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          startIcon={<QrCodeIcon />}
          onClick={handleGenerate}
          disabled={addBarcode.isPending}
          sx={{ mr: 'auto' }}
        >
          Auto-generate
        </Button>
        <Button variant="outlined" onClick={onClose} disabled={addBarcode.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={addBarcode.isPending || !value.trim()}
        >
          Add barcode
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export function BarcodeManager({ productId, barcodes, productName }: Props) {
  const [addOpen,        setAddOpen]        = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState<string | null>(null)
  const deleteBarcode = useDeleteBarcode()

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight={600}>Barcodes</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
        >
          Add barcode
        </Button>
      </Box>

      {barcodes.length === 0 ? (
        <Box py={4} textAlign="center" border="1px dashed" borderColor="divider" borderRadius={2}>
          <Typography variant="body2" color="text.secondary">
            No barcodes assigned. Add one manually or auto-generate.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {barcodes.map((bc) => (
            <Grid item key={bc.id} xs={12} sm={6} md={4}>
              <Box
                position="relative"
                display="flex"
                flexDirection="column"
                alignItems="center"
                p={1.5}
                border="1px solid"
                borderColor="divider"
                borderRadius={2}
                bgcolor="background.paper"
              >
                {bc.is_generated && (
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ position: 'absolute', top: 6, left: 10, fontSize: '0.65rem' }}
                  >
                    Generated
                  </Typography>
                )}

                <Tooltip title="Delete barcode" arrow placement="top">
                  <IconButton
                    size="small"
                    color="error"
                    sx={{ position: 'absolute', top: 4, right: 4 }}
                    onClick={() => setDeleteConfirm(bc.id)}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>

                <Box mt={bc.is_generated ? 2.5 : 0.5}>
                  <BarcodeDisplay
                    value={bc.barcode}
                    label={productName}
                    showValue
                    compact
                  />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <AddBarcodeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        productId={productId}
        productName={productName}
      />

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        open={!!deleteConfirm}
        title="Remove barcode?"
        itemName={deleteConfirm ? `${productName || 'Barcode'} - ${barcodes.find(b => b.id === deleteConfirm)?.barcode}` : ''}
        description="You are about to remove"
        warningMessage="This barcode will no longer be recognised at the point of sale."
        isPending={deleteBarcode.isPending}
        onConfirm={() => {
          if (deleteConfirm) {
            deleteBarcode.mutate(deleteConfirm, {
              onSuccess: () => setDeleteConfirm(null),
            })
          }
        }}
        onClose={() => setDeleteConfirm(null)}
        confirmButtonText="Remove"
      />
    </Box>
  )
}
