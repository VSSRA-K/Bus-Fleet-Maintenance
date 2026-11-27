import { Chip } from '@mui/material';

const BUS_STATUS_COLORS = {
  Available: 'success',
  'Under Maintenance': 'warning',
  'Out of Service': 'error',
};

export function BusStatusChip({ status, size = 'small' }) {
  return <Chip label={status} size={size} color={BUS_STATUS_COLORS[status] || 'default'} variant="outlined" />;
}

const DUE_LABELS = { SCHEDULED: 'Scheduled', UPCOMING: 'Upcoming', OVERDUE: 'Overdue' };
const DUE_COLORS = { SCHEDULED: 'default', UPCOMING: 'warning', OVERDUE: 'error' };

// dueStatus is null for superseded records (the same service has since been repeated).
export function DueStatusChip({ status, hasDueDate = true }) {
  if (!status || !hasDueDate) return <span>—</span>;
  return <Chip label={DUE_LABELS[status]} size="small" color={DUE_COLORS[status]} variant={status === 'SCHEDULED' ? 'outlined' : 'filled'} />;
}
