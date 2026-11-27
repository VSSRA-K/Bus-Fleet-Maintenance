import { Avatar, Box, Paper, Typography } from '@mui/material';
import BusIcon from '@mui/icons-material/DirectionsBusFilledOutlined';
import BuildIcon from '@mui/icons-material/BuildCircleOutlined';
import BellIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ChartIcon from '@mui/icons-material/InsightsOutlined';
import { colors } from '../theme';

const HIGHLIGHTS = [
  { icon: <BuildIcon />, text: 'One service history for every bus' },
  { icon: <BellIcon />, text: 'Daily in-app reminders before services fall due' },
  { icon: <ChartIcon />, text: 'Fleet status and maintenance-cost insight' },
];

// Shared split-screen frame for the Login and Register pages.
export default function AuthShell({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '44%',
          p: 6,
          color: '#fff',
          background: `linear-gradient(160deg, ${colors.navy} 0%, #1E3A8A 100%)`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: colors.blue, width: 44, height: 44 }}>
            <BusIcon />
          </Avatar>
          <Typography variant="h5" sx={{ color: '#fff' }}>
            BusCare
          </Typography>
        </Box>
        <Box>
          <Typography variant="h4" sx={{ color: '#fff', mb: 3, maxWidth: 420 }}>
            Keep every bus on the road, on schedule.
          </Typography>
          {HIGHLIGHTS.map((h) => (
            <Box key={h.text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, color: '#CBD5E1' }}>
              {h.icon}
              <Typography>{h.text}</Typography>
            </Box>
          ))}
        </Box>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>
          Bus Fleet Maintenance and Reliability Management System
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'grid', placeItems: 'center', p: 3, bgcolor: 'background.default' }}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, width: '100%', maxWidth: 440, border: `1px solid ${colors.border}` }} elevation={0}>
          <Typography variant="h5">{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
            {subtitle}
          </Typography>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
