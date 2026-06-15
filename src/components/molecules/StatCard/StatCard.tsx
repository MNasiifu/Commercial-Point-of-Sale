import { Box, Button, Card, CardContent, Typography, Skeleton, type SxProps } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import type { ReactNode } from 'react'
import type { Theme } from '@mui/material/styles'

interface Props {
  title:      string
  value:      string | number
  subtitle?:  string
  icon?:      ReactNode
  iconColor?: string
  iconBg?:    string
  trend?:     { value: number; label?: string }
  loading?:   boolean
  onClick?:   () => void
  sx?:        SxProps<Theme>
}

export function StatCard({
  title, value, subtitle, icon, iconColor = 'primary.main',
  iconBg = 'primary.50', trend, loading = false, onClick, sx,
}: Props) {
  const trendPositive = (trend?.value ?? 0) >= 0

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': onClick
          ? { boxShadow: 4, transform: 'translateY(-2px)' }
          : undefined,
        ...sx,
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          '&:last-child': { pb: 2.5 },
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        <Box flex={1} display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <Box flex={1} minWidth={0}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              textTransform="uppercase"
              letterSpacing={0.5}
              display="block"
              mb={0.75}
            >
              {title}
            </Typography>

            {loading ? (
              <>
                <Skeleton variant="text" width="60%" height={36} />
                <Skeleton variant="text" width="40%" height={18} />
              </>
            ) : (
              <>
                <Typography variant="h4" fontWeight={700} lineHeight={1.1} mb={0.5} noWrap>
                  {value}
                </Typography>

                {(subtitle || trend) && (
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    {trend && (
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={trendPositive ? 'success.main' : 'error.main'}
                      >
                        {trendPositive ? '+' : ''}{trend.value}%
                        {trend.label ? ` ${trend.label}` : ''}
                      </Typography>
                    )}
                    {subtitle && (
                      <Typography variant="caption" color="text.secondary">
                        {subtitle}
                      </Typography>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>

          {icon && (
            <Box
              sx={{
                width: 48, height: 48,
                borderRadius: 2.5,
                bgcolor: iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: iconColor,
                '& svg': { fontSize: 24 },
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {onClick && !loading && (
          <Box display="flex" justifyContent="flex-end" mt={1.5}>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              sx={{ textTransform: 'none' }}
            >
              View
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
