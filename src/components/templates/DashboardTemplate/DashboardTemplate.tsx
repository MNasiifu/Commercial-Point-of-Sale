import { useState, type ReactNode } from 'react'
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material'
import { AppSidebar }            from '@/components/organisms/AppSidebar/AppSidebar'
import { AppHeader }             from '@/components/organisms/AppHeader/AppHeader'
import { InactivityWarning }     from '@/components/molecules/InactivityWarning/InactivityWarning'
import { OfflineBanner }         from '@/components/molecules/OfflineBanner/OfflineBanner'
import { PwaUpdatePrompt }       from '@/components/molecules/PwaUpdatePrompt/PwaUpdatePrompt'
import { useInactivityLogout }   from '@/hooks/auth/useInactivityLogout'
import { tokens }                from '@/theme/tokens'

interface Props {
  children: ReactNode
}

export function DashboardTemplate({ children }: Props) {
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const { showWarning, secondsLeft, stayLoggedIn, logout } = useInactivityLogout()

  // Match the current sidebar width to keep the header aligned
  const sidebarWidth = isMobile ? 0 : tokens.sidebar.expandedWidth

  return (
    <Box display="flex" minHeight="100vh" sx={{ bgcolor: 'background.default' }}>
      {/* Sidebar */}
      <AppSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content area */}
      <Box
        component="main"
        flex={1}
        display="flex"
        flexDirection="column"
        minWidth={0}
        sx={{
          ml: { md: 0 },
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        }}
      >
        {/* Fixed top bar */}
        <AppHeader
          onMenuClick={() => setMobileOpen(true)}
          sidebarWidth={sidebarWidth}
        />

        {/* Offset for fixed AppBar */}
        <Toolbar sx={{ minHeight: 64 }} />

        {/* PWA banners — appear below the fixed header */}
        <OfflineBanner />
        <PwaUpdatePrompt />

        {/* Page content */}
        <Box
          flex={1}
          p={{ xs: 2, sm: 3 }}
          overflow="auto"
        >
          {children}
        </Box>
      </Box>

      {/* Inactivity warning dialog */}
      <InactivityWarning
        open={showWarning}
        secondsLeft={secondsLeft}
        onStay={stayLoggedIn}
        onLogout={logout}
      />
    </Box>
  )
}
