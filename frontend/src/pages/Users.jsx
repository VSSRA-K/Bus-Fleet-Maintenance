import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';

const ROLE_LABELS = { ADMIN: 'Administrator', MECHANIC: 'Mechanic' };

function AddUserDialog({ open, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', role: 'MECHANIC', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', role: 'MECHANIC', password: '' });
      setErrors({});
      setServerError('');
    }
  }, [open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (ev) => {
    ev.preventDefault();
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    setServerError('');
    try {
      await api.post('/users', { ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('User created successfully');
      onSaved();
    } catch (err) {
      setServerError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <form onSubmit={submit} noValidate>
        <DialogTitle>Add user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <TextField label="Full name" value={form.name} onChange={set('name')} error={Boolean(errors.name)} helperText={errors.name} autoFocus fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={set('email')} error={Boolean(errors.email)} helperText={errors.email} fullWidth />
            <TextField select label="Role" value={form.role} onChange={set('role')} fullWidth>
              <MenuItem value="MECHANIC">Mechanic</MenuItem>
              <MenuItem value="ADMIN">Administrator</MenuItem>
            </TextField>
            <TextField label="Initial password" type="password" value={form.password} onChange={set('password')} error={Boolean(errors.password)} helperText={errors.password || 'At least 8 characters'} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving…' : 'Create user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(() => {
    api
      .get('/users')
      .then((res) => {
        setUsers(res.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (u, changes, message) => {
    try {
      await api.patch(`/users/${u._id}`, changes);
      toast.success(message);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle="Create accounts, assign roles and deactivate access."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Add user
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const isSelf = u._id === me.id;
                return (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{u.name}</Typography>
                      {isSelf && <Chip label="You" size="small" sx={{ ml: 1, height: 20 }} />}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => patch(u, { role: e.target.value }, `${u.name} is now ${ROLE_LABELS[e.target.value]}`)}
                        sx={{ minWidth: 160 }}
                      >
                        <MenuItem value="MECHANIC">{ROLE_LABELS.MECHANIC}</MenuItem>
                        <MenuItem value="ADMIN">{ROLE_LABELS.ADMIN}</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.isActive}
                        disabled={isSelf}
                        onChange={(e) => patch(u, { isActive: e.target.checked }, `${u.name} ${e.target.checked ? 'activated' : 'deactivated'}`)}
                        inputProps={{ 'aria-label': `Toggle ${u.name} active` }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <AddUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          load();
        }}
      />
    </>
  );
}
