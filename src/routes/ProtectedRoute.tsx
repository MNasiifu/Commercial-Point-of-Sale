import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { useAuth } from '@/hooks/auth/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isInitialized, mustChangePassword } = useAuth()
  const location = useLocation()

  // Still bootstrapping session from localStorage
  if (!isInitialized) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Force password change before accessing any other page
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  return <Outlet />
}
