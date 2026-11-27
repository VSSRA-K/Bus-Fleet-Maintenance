import { createTheme } from '@mui/material/styles';

// Light, "transit control room" look: navy sidebar, blue primary, teal secondary.
export const colors = {
  navy: '#0F172A',
  navyLight: '#1E293B',
  blue: '#1D4ED8',
  teal: '#0F766E',
  green: '#15803D',
  amber: '#B45309',
  red: '#B91C1C',
  slate: '#64748B',
  surface: '#F1F5F9',
  border: '#E2E8F0',
};

export const chartColors = ['#1D4ED8', '#0F766E', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D', '#EA580C'];

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.blue },
    secondary: { main: colors.teal },
    success: { main: colors.green },
    warning: { main: colors.amber },
    error: { main: colors.red },
    background: { default: colors.surface, paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: colors.slate },
    divider: colors.border,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h4: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 800, letterSpacing: '-0.02em' },
    h5: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    h6: { fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: {
      styleOverrides: { root: { border: `1px solid ${colors.border}`, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' } },
    },
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700, color: colors.slate, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' },
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
  },
});

export default theme;
