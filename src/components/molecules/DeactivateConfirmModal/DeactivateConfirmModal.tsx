import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

interface DeactivateConfirmModalProps {
  open: boolean
  title: string
  displayName: string
  subtitle?: string | null
  warning: string
  isPending: boolean
  onConfirm: () => void
  onClose: () => void
}

export function DeactivateConfirmModal({
  open,
  title,
  displayName,
  subtitle,
  warning,
  isPending,
  onConfirm,
  onClose,
}: DeactivateConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          elevation: 4,
          sx: { borderRadius: 3 },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: 'error.lighter',
            flexShrink: 0,
          }}
        >
          <DeleteOutlineIcon color="error" fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {title}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <DialogContentText
          component="div"
          sx={{ color: 'text.primary', fontSize: '0.9rem' }}
        >
          You are about to deactivate{' '}
          <Typography
            component="span"
            fontWeight={700}
            color="text.primary"
            fontSize="inherit"
          >
            {displayName}
          </Typography>
          {subtitle && (
            <>
              {' '}
              <Typography
                component="span"
                color="text.secondary"
                fontSize="0.82rem"
              >
                ({subtitle})
              </Typography>
            </>
          )}
          .
        </DialogContentText>

        <DialogContentText
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: 'error.lighter',
            borderRadius: 2,
            color: 'error.dark',
            fontSize: '0.82rem',
            fontWeight: 500,
          }}
        >
          {warning}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isPending}
          sx={{ flex: 1, borderRadius: 2 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
          sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
        >
          {isPending ? 'Deactivating…' : 'Deactivate'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
