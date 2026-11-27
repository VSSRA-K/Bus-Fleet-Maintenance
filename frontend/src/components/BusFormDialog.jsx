import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from '@mui/material';
import api, { errorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { BUS_STATUSES, FUEL_TYPES } from '../utils/format';

const EMPTY = {
  registrationNo: '',
  manufacturer: '',
  model: '',
  year: new Date().getFullYear(),
  fuelType: 'Diesel',
  currentOdometerKm: 0,
  status: 'Available',
};

// Add (bus = null) or edit a bus. Administrator only.
export default function BusFormDialog({ open, bus, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(bus ? { ...EMPTY, ...bus } : EMPTY);
      setErrors({});
      setServerError('');
    }
  }, [open, bus]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!String(form.registrationNo).trim()) e.registrationNo = 'Registration number is required';
    if (!String(form.manufacturer).trim()) e.manufacturer = 'Manufacturer is required';
    if (!String(form.model).trim()) e.model = 'Model is required';
    const year = Number(form.year);
    if (!Number.isInteger(year) || year < 1980 || year > new Date().getFullYear() + 1) e.year = 'Enter a valid year';
    const km = Number(form.currentOdometerKm);
    if (form.currentOdometerKm === '' || !Number.isFinite(km) || km < 0) e.currentOdometerKm = 'Odometer cannot be negative';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    const payload = {
      registrationNo: form.registrationNo,
      manufacturer: form.manufacturer,
      model: form.model,
      year: Number(form.year),
      fuelType: form.fuelType,
      currentOdometerKm: Number(form.currentOdometerKm),
      status: form.status,
    };
    try {
      if (bus) await api.put(`/buses/${bus._id}`, payload);
      else await api.post('/buses', payload);
      toast.success(bus ? 'Bus updated successfully' : 'Bus added successfully');
      onSaved();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={submit} noValidate>
        <DialogTitle>{bus ? 'Edit bus' : 'Add bus'}</DialogTitle>
        <DialogContent>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                label="Registration number"
                value={form.registrationNo}
                onChange={set('registrationNo')}
                error={Boolean(errors.registrationNo)}
                helperText={errors.registrationNo}
                fullWidth
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Manufacturer" value={form.manufacturer} onChange={set('manufacturer')} error={Boolean(errors.manufacturer)} helperText={errors.manufacturer} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Model" value={form.model} onChange={set('model')} error={Boolean(errors.model)} helperText={errors.model} fullWidth required />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Year" type="number" value={form.year} onChange={set('year')} error={Boolean(errors.year)} helperText={errors.year} fullWidth required />
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Fuel type" value={form.fuelType} onChange={set('fuelType')} fullWidth>
                {FUEL_TYPES.map((f) => (
                  <MenuItem key={f} value={f}>
                    {f}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Current odometer (km)"
                type="number"
                value={form.currentOdometerKm}
                onChange={set('currentOdometerKm')}
                error={Boolean(errors.currentOdometerKm)}
                helperText={errors.currentOdometerKm}
                fullWidth
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Status" value={form.status} onChange={set('status')} fullWidth>
                {BUS_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
