import { useEffect, useState } from 'react'
import { Box, Typography, IconButton, Tooltip, Skeleton } from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import { renderBarcodeSvg, downloadBarcode } from '@/lib/barcode'

interface Props {
  value:      string
  label?:     string
  showValue?: boolean
  height?:    number
  scale?:     number
  onDownload?: () => void
  compact?:   boolean
}

export function BarcodeDisplay({
  value, label, showValue = true, height = 10, scale = 2, compact = false,
}: Props) {
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!value) return
    try {
      const rendered = renderBarcodeSvg(value, { height, scale })
      setSvg(rendered)
      setError(false)
    } catch {
      setError(true)
    }
  }, [value, height, scale])

  if (error) {
    return (
      <Box p={1} border="1px dashed" borderColor="error.main" borderRadius={1} textAlign="center">
        <Typography variant="caption" color="error">Invalid barcode</Typography>
      </Box>
    )
  }

  if (!svg) return <Skeleton variant="rectangular" width={160} height={60} sx={{ borderRadius: 1 }} />

  return (
    <Box
      display="inline-flex"
      flexDirection="column"
      alignItems="center"
      gap={0.5}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        p: compact ? 1 : 1.5,
        bgcolor: '#ffffff',
        cursor: 'default',
      }}
    >
      {label && (
        <Typography variant="caption" fontWeight={600} color="text.primary" noWrap sx={{ maxWidth: 200 }}>
          {label}
        </Typography>
      )}

      <Box
        dangerouslySetInnerHTML={{ __html: svg }}
        sx={{ '& svg': { display: 'block', maxWidth: '100%' } }}
      />

      {showValue && (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="caption" fontFamily="monospace" color="text.secondary">
            {value}
          </Typography>
          <Tooltip title="Download barcode" arrow>
            <IconButton
              size="small"
              onClick={() => downloadBarcode(value, label)}
              sx={{ p: 0.25 }}
            >
              <DownloadIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  )
}
