import { Box, Typography, Card, CardContent } from '@mui/material'
import BuildIcon from '@mui/icons-material/Build'
import { DashboardTemplate } from '@/components/templates/DashboardTemplate/DashboardTemplate'

interface Props {
  title: string
  phase: number
  description?: string
}

export function PlaceholderPage({ title, phase, description }: Props) {
  return (
    <DashboardTemplate>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>{title}</Typography>
      </Box>
      <Card sx={{ borderStyle: 'dashed', bgcolor: 'transparent' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} py={3}>
            <BuildIcon color="action" sx={{ fontSize: 48, opacity: 0.35 }} />
            <Box>
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                {title} — Phase {phase}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                {description ?? `This module will be fully implemented in Phase ${phase}.`}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </DashboardTemplate>
  )
}
