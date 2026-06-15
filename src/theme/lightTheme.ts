import { createTheme } from '@mui/material/styles'
import { tokens } from './tokens'

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:        tokens.palette.primary[800],
      light:       tokens.palette.primary[400],
      dark:        tokens.palette.primary[900],
      contrastText: '#ffffff',
    },
    secondary: {
      main:        tokens.palette.secondary[600],
      light:       tokens.palette.secondary[300],
      dark:        tokens.palette.secondary[800],
      contrastText: '#ffffff',
    },
    success:  { main: tokens.palette.success.main, light: tokens.palette.success.light, dark: tokens.palette.success.dark },
    warning:  { main: tokens.palette.warning.main, light: tokens.palette.warning.light, dark: tokens.palette.warning.dark },
    error:    { main: tokens.palette.error.main,   light: tokens.palette.error.light,   dark: tokens.palette.error.dark   },
    info:     { main: tokens.palette.info.main,    light: tokens.palette.info.light,    dark: tokens.palette.info.dark    },
    background: {
      default: '#F1F5F9',
      paper:   '#FFFFFF',
    },
    text: {
      primary:   '#0F172A',
      secondary: '#475569',
      disabled:  '#94A3B8',
    },
    divider: '#E2E8F0',
  },
  shape: { borderRadius: tokens.shape.borderRadius },
  typography: {
    fontFamily: [
      'Inter', '-apple-system', 'BlinkMacSystemFont',
      '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
    ].join(','),
    h1: { fontSize: '2rem',    fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.75rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem',  fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '1rem',    fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '0.9375rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem',  fontWeight: 500 },
    body1:     { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2:     { fontSize: '0.875rem',  lineHeight: 1.6 },
    caption:   { fontSize: '0.75rem',   lineHeight: 1.5 },
    button:    { fontSize: '0.875rem',  fontWeight: 600, textTransform: 'none', letterSpacing: 0.2 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: { backgroundColor: '#F1F5F9' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: '#F1F5F9' },
        '::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: 3 },
        '::-webkit-scrollbar-thumb:hover': { background: '#94A3B8' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 20px', fontWeight: 600 },
        sizeLarge: { padding: '12px 28px', fontSize: '1rem' },
        sizeSmall: { padding: '4px 12px', fontSize: '0.8125rem' },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(21,101,192,0.3)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: tokens.shadows.card,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 12 },
        outlined: { border: '1px solid #E2E8F0' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': { borderColor: '#CBD5E1' },
            '&:hover fieldset': { borderColor: tokens.palette.primary[800] },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 6, fontWeight: 500 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#475569',
            backgroundColor: '#F8FAFC',
            borderBottom: '2px solid #E2E8F0',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontWeight: 600, fontSize: '1.125rem' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { borderRadius: 6, fontSize: '0.8125rem' },
      },
    },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 4 } },
    },
  },
})
