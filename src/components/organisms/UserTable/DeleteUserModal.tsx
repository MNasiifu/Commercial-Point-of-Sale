import { useEffect, useState } from 'react'
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
  TextField,
} from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import type { UserWithBranch } from '@/services/userService'

interface DeleteUserModalProps {
  open:      boolean
  user:      UserWithBranch | null
  isPending: boolean
  onConfirm: (confirmedEmail: string) => void
  onClose:   () => void
}

export function DeleteUserModal({
  open,
  user,
  isPending,
  onConfirm,
  onClose,
}: DeleteUserModalProps) {
  const [emailInput, setEmailInput] = useState('')

  useEffect(() => {
    if (!open) setEmailInput('')
  }, [open])

  if (!user) return null

  const emailMatches =
    emailInput.trim().toLowerCase() === user.email.trim().toLowerCase()

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { elevation: 4, sx: { borderRadius: 3 } },
      }}
    >
      <DialogTitle
        sx={{
          display:    'flex',
          alignItems: 'center',
          gap:        1.5,
          pb:         1,
          pt:         2.5,
          px:         3,
        }}
      >
        <Box
          sx={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            width:          36,
            height:         36,
            borderRadius:     '50%',
            bgcolor:        'error.lighter',
            flexShrink:     0,
          }}
        >
          <DeleteOutlineIcon color="error" fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          Remove account?
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <DialogContentText
          component="div"
          sx={{ color: 'text.primary', fontSize: '0.9rem' }}
        >
          You are about to remove{' '}
          <Typography
            component="span"
            fontWeight={700}
            color="text.primary"
            fontSize="inherit"
          >
            {user.full_name}
          </Typography>
          . This account will be soft-deleted and will no longer appear in user
          lists or be able to sign in.
        </DialogContentText>

        <DialogContentText
          sx={{
            mt:           1.5,
            p:            1.5,
            bgcolor:      'error.lighter',
            borderRadius: 2,
            color:        'error.dark',
            fontSize:     '0.82rem',
            fontWeight:     500,
          }}
        >
          Type <strong>{user.email}</strong> below to confirm. This action
          cannot be undone from the app.
        </DialogContentText>

        <TextField
          fullWidth
          size="small"
          label="Confirm email"
          placeholder={user.email}
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          disabled={isPending}
          autoComplete="off"
          sx={{ mt: 2 }}
          error={emailInput.length > 0 && !emailMatches}
          helperText={
            emailInput.length > 0 && !emailMatches
              ? 'Email does not match'
              : ' '
          }
        />
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
          onClick={() => onConfirm(emailInput.trim())}
          disabled={isPending || !emailMatches}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
          sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
        >
          {isPending ? 'Removing…' : 'Remove account'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
