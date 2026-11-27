// Dates are exchanged as ISO strings; date-only values are shown in UTC so they never shift a day.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export const formatKm = (n) => `${new Intl.NumberFormat('en-IN').format(n || 0)} km`;

export const monthLabel = (yyyyMm) => {
  const [y, m] = yyyyMm.split('-').map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
};

export const BUS_STATUSES = ['Available', 'Under Maintenance', 'Out of Service'];
export const FUEL_TYPES = ['Diesel', 'Petrol', 'CNG', 'Electric', 'Hybrid'];
export const SERVICE_CATEGORIES = ['Preventive', 'Repair', 'Inspection'];
export const SERVICE_TYPE_SUGGESTIONS = [
  'Engine Oil Change',
  'Brake Inspection',
  'Tyre Rotation',
  'Air Filter Replacement',
  'Coolant Flush',
  'Battery Check',
  'Clutch Repair',
  'Suspension Repair',
  'General Inspection',
];
