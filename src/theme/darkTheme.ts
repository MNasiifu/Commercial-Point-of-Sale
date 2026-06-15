import { createTheme } from '@mui/material/styles'
import { tokens } from './tokens'
import { lightTheme } from './lightTheme'

export const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main:        tokens.palette.primary[400],
      light:       tokens.palette.primary[200],
      dark:        tokens.palette.primary[700],
      contrastText: '#0F172A',
    },
    secondary: {
      main:        tokens.palette.secondary[400],
      light:       tokens.palette.secondary[200],
      dark:        tokens.palette.secondary[700],
      contrastText: '#0F172A',
    },
    success:  { main: '#4CAF50', light: '#81C784', dark: '#388E3C' },
    warning:  { main: '#FFB300', light: '#FFD54F', dark: '#FF8F00' },
    error:    { main: '#EF5350', light: '#EF9A9A', dark: '#C62828' },
    info:     { main: '#29B6F6', light: '#81D4FA', dark: '#0277BD' },
    background: {
      default: '#0F172A',
      paper:   '#1E293B',
    },
    text: {
      primary:   '#F1F5F9',
      secondary: '#94A3B8',
      disabled:  '#475569',
    },
    divider: '#334155',
  },
  components: {
    ...lightTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: { backgroundColor: '#0F172A' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: '#1E293B' },
        '::-webkit-scrollbar-thumb': { background: '#475569', borderRadius: 3 },
        '::-webkit-scrollbar-thumb:hover': { background: '#64748B' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #334155',
          backgroundColor: '#1E293B',
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 12, backgroundColor: '#1E293B' },
        outlined: { border: '1px solid #334155' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#0F172A',
            '& fieldset': { borderColor: '#334155' },
            '&:hover fieldset': { borderColor: tokens.palette.primary[400] },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.8125rem',
            color: '#94A3B8',
            backgroundColor: '#0F172A',
            borderBottom: '2px solid #334155',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#0F172A' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },
  },
})
