import { createTheme } from '@mui/material/styles'

export const getTheme = (mode='light') => createTheme({
  palette: {
    mode,
    primary: { main: '#2563EB' },
    secondary: { main: '#6366F1' },
    success: { main: '#16A34A' },
    warning: { main: '#F59E0B' },
    error: { main: '#DC2626' }
  },
  typography: { fontFamily: 'Roboto, sans-serif' }
})





