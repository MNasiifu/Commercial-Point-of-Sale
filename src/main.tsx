import { StrictMode } from 'react'
import { createRoot }  from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools }  from '@tanstack/react-query-devtools'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs }         from '@mui/x-date-pickers/AdapterDayjs'

import { queryClient }   from '@/lib/queryClient'
import { useThemeStore } from '@/store/themeStore'
import { lightTheme }    from '@/theme/lightTheme'
import { darkTheme }     from '@/theme/darkTheme'
import { App }             from './App'
import { reportWebVitals } from '@/lib/webVitals'

function Root() {
  const mode = useThemeStore((s) => s.mode)
  const theme = mode === 'dark' ? darkTheme : lightTheme

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <App />
        </LocalizationProvider>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
)

reportWebVitals()
