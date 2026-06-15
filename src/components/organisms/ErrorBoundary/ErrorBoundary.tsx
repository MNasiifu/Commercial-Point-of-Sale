import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Box, Button, Typography } from '@mui/material'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

interface Props  { children: ReactNode }
interface State  { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <Box
        display="flex" flexDirection="column" alignItems="center"
        justifyContent="center" minHeight="100vh" gap={2} p={4}
        textAlign="center"
      >
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h5" fontWeight={700}>Something went wrong</Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={480}>
          {this.state.message || 'An unexpected error occurred. Please reload the page.'}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Box>
    )
  }
}
