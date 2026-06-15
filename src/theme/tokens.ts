export const tokens = {
  palette: {
    primary: {
      50:  '#E3F2FD',
      100: '#BBDEFB',
      200: '#90CAF9',
      300: '#64B5F6',
      400: '#42A5F5',
      500: '#2196F3',
      600: '#1E88E5',
      700: '#1976D2',
      800: '#1565C0',  // main
      900: '#0D47A1',
    },
    secondary: {
      50:  '#E0F2F1',
      100: '#B2DFDB',
      200: '#80CBC4',
      300: '#4DB6AC',
      400: '#26A69A',
      500: '#009688',
      600: '#00897B',  // main
      700: '#00796B',
      800: '#00695C',
      900: '#004D40',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    warning: {
      main: '#F57F17',
      light: '#FFB300',
      dark: '#E65100',
    },
    error: {
      main: '#C62828',
      light: '#EF5350',
      dark: '#B71C1C',
    },
    info: {
      main: '#0277BD',
      light: '#29B6F6',
      dark: '#01579B',
    },
    expiry: {
      critical: '#B71C1C',   // < 7 days
      warning:  '#F57F17',   // 7-30 days
      ok:       '#2E7D32',   // > 30 days
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: {
    card: '0 2px 8px rgba(0,0,0,0.08)',
    elevated: '0 4px 20px rgba(0,0,0,0.12)',
    sidebar: '2px 0 8px rgba(0,0,0,0.08)',
  },
  sidebar: {
    expandedWidth: 260,
    collapsedWidth: 72,
  },
} as const
