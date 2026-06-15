import { RouterProvider } from 'react-router-dom'
import { router }               from '@/routes'
import { useAuthBootstrap }     from '@/hooks/auth/useAuthBootstrap'
import { NotificationManager }  from '@/components/organisms/NotificationManager/NotificationManager'
import { ErrorBoundary }        from '@/components/organisms/ErrorBoundary/ErrorBoundary'

/**
 * AuthBootstrap lives at the very root of the component tree so the
 * Supabase session is restored exactly once, before any route guard
 * attempts to read isInitialized. This prevents the "stuck spinner on
 * hard reload" bug caused by the bootstrap living inside ProtectedRoute
 * (which can unmount during navigation, cancelling the init mid-flight).
 */
function AuthBootstrap() {
  useAuthBootstrap()
  return null
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthBootstrap />
      <RouterProvider router={router} />
      <NotificationManager />
    </ErrorBoundary>
  )
}
