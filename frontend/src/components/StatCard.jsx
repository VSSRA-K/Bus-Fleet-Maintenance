import { Box, Card, Typography } from '@mui/material';

export default function StatCard({ label, value, hint, icon, accent = '#1D4ED8' }) {
  return (
    <Card sx={{ p: 2.5, height: '100%', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          color: accent,
          bgcolor: `${accent}14`,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.25 }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
    </Card>
  );
}
