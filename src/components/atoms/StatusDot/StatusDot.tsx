import { Box, Tooltip } from '@mui/material'
import { useOnlineStatus } from '@/hooks/offline/useOnlineStatus'

export function StatusDot() {
  const isOnline = useOnlineStatus()

  return (
    <Tooltip title={isOnline ? 'Online — data syncing' : 'Offline — sales queued for sync'} arrow>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: isOnline ? 'success.main' : 'warning.main',
          boxShadow: isOnline
            ? '0 0 0 3px rgba(46,125,50,0.2)'
            : '0 0 0 3px rgba(245,127,23,0.25)',
          animation: !isOnline ? 'pulse 2s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%':       { opacity: 0.4 },
          },
        }}
      />
    </Tooltip>
  )
}
