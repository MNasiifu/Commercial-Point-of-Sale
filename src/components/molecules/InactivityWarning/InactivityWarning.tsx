import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, LinearProgress, Box,
} from '@mui/material'
import TimerOffIcon from '@mui/icons-material/TimerOff'

interface Props {
  open: boolean
  secondsLeft: number
  onStay: () => void
  onLogout: () => void
}

export function InactivityWarning({ open, secondsLeft, onStay, onLogout }: Props) {
  const progress = (secondsLeft / 60) * 100

  return (
    <Dialog open={open} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <TimerOffIcon color="warning" />
          Session Expiring
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography color="text.secondary" mb={3}>
          You have been inactive. Your session will end automatically in{' '}
          <strong>{secondsLeft} second{secondsLeft !== 1 ? 's' : ''}</strong>.
        </Typography>

        <LinearProgress
          variant="determinate"
          value={progress}
          color={secondsLeft <= 15 ? 'error' : 'warning'}
          sx={{ borderRadius: 2, height: 8 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button variant="outlined" color="error" onClick={onLogout}>
          Sign out now
        </Button>
        <Button variant="contained" onClick={onStay} autoFocus>
          Stay logged in
        </Button>
      </DialogActions>
    </Dialog>
  )
}
