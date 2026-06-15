import { Alert, Collapse } from '@mui/material'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import { useNetworkStatus } from '@/hooks/app/useNetworkStatus'

export function OfflineBanner() {
  const isOnline = useNetworkStatus()

  return (
    <Collapse in={!isOnline} unmountOnExit>
      <Alert
        severity="warning"
        icon={<WifiOffIcon fontSize="small" />}
        sx={{
          borderRadius: 0,
          py: 0.5,
          '& .MuiAlert-message': { fontSize: '0.8rem' },
        }}
      >
        You are offline — read-only mode. Sales and changes will fail until connectivity is restored.
      </Alert>
    </Collapse>
  )
}
