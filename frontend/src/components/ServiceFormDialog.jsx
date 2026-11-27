import { useEffect, useState } from 'react';
import {
  Alert,
  Autocomplete,
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
import { SERVICE_CATEGORIES, SERVICE_TYPE_SUGGESTIONS, toInputDate } from '../utils/format';

const todayInput = () => new Date().toISOString().slice(0, 10);

const emptyForm = (busId = '') => ({
  busId,
  serviceType: '',
  category: 'Preventive',
  description: '',
  serviceDate: todayInput(),
  odometerKm: '',
  cost: '',
  nextDueDate: '',
});

// Record (record = null) or edit a service. `buses` lists the choosable buses; `fixedBusId`
// locks the bus (used on the bus detail page). The bus of an existing record cannot change.
export default function ServiceFormDialog({ open, record, buses = [], fixedBusId, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        busId: record.busId?._id || record.busId,
        serviceType: record.serviceType,
        category: record.category,
        description: record.description || '',
        serviceDate: toInputDate(record.serviceDate),
        odometerKm: record.odometerKm,
        cost: record.cost,
        nextDueDate: toInputDate(record.nextDueDate),
      });
    } else {
      setForm(emptyForm(fixedBusId || ''));
    }
    setErrors({});
    setServerError('');
  }, [open, record, fixedBusId]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const busLocked = Boolean(record || fixedBusId);

  const validate = () => {
    const e = {};
    if (!form.busId) e.busId = 'Select a bus';
    if (!form.serviceType.trim()) e.serviceType = 'Service type is required';
    if (!form.serviceDate) e.serviceDate = 'Service date is required';
    const km = Number(form.odometerKm);
    if (form.odometerKm === '' || !Number.isFinite(km) || km < 0) e.odometerKm = 'Enter a reading of 0 or more';
    const cost = Number(form.cost);
    if (form.cost === '' || !Number.isFinite(cost) || cost < 0) e.cost = 'Enter a cost of 0 or more';
    if (form.nextDueDate && form.serviceDate && form.nextDueDate < form.serviceDate) {
      e.nextDueDate = 'Cannot be earlier than the service date';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    const payload = {
      serviceType: form.serviceType,
      category: form.category,
      description: form.description,
      serviceDate: form.serviceDate,
      odometerKm: Number(form.odometerKm),
      cost: Number(form.cost),
      nextDueDate: form.nextDueDate || null,
    };
    try {
      if (record) await api.put(`/service-records/${record._id}`, payload);
      else await api.post('/service-records', { ...payload, busId: form.busId });
      toast.success(record ? 'Service record updated' : 'Service record saved');
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
        <DialogTitle>{record ? 'Edit service record' : 'Record a service'}</DialogTitle>
        <DialogContent>
          {serverError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {serverError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Bus"
                value={form.busId}
                onChange={set('busId')}
                error={Boolean(errors.busId)}
                helperText={errors.busId}
                disabled={busLocked}
                fullWidth
                required
              >
                {buses.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.registrationNo} — {b.manufacturer} {b.model}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={7}>
              <Autocomplete
                freeSolo
                options={SERVICE_TYPE_SUGGESTIONS}
                inputValue={form.serviceType}
                onInputChange={(_, value) => setForm((f) => ({ ...f, serviceType: value }))}
                renderInput={(params) => (
                  <TextField {...params} label="Service type" error={Boolean(errors.serviceType)} helperText={errors.serviceType} required />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField select label="Category" value={form.category} onChange={set('category')} fullWidth>
                {SERVICE_CATEGORIES.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Description" value={form.description} onChange={set('description')} multiline minRows={2} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Service date"
                type="date"
                value={form.serviceDate}
                onChange={set('serviceDate')}
                error={Boolean(errors.serviceDate)}
                helperText={errors.serviceDate}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Next due date"
                type="date"
                value={form.nextDueDate}
                onChange={set('nextDueDate')}
                error={Boolean(errors.nextDueDate)}
                helperText={errors.nextDueDate || 'Optional — drives reminders'}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Odometer reading (km)"
                type="number"
                value={form.odometerKm}
                onChange={set('odometerKm')}
                error={Boolean(errors.odometerKm)}
                helperText={errors.odometerKm}
                inputProps={{ min: 0 }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Total cost (INR)"
                type="number"
                value={form.cost}
                onChange={set('cost')}
                error={Boolean(errors.cost)}
                helperText={errors.cost}
                inputProps={{ min: 0 }}
                fullWidth
                required
              />
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
