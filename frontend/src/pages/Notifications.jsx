import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/DoneAll';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import { NOTIFICATIONS_CHANGED } from '../components/Layout';
import { formatDateTime } from '../utils/format';
import { colors } from '../theme';

function ReminderWindowCard() {
  const toast = useToast();
  const [days, setDays] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/settings/reminder-window')
      .then((res) => setDays(String(res.data.days)))
      .catch(() => {});
  }, []);

  const save = async () => {
    const n = Number(days);
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      toast.error('Reminder window must be a whole number between 1 and 30 days');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/settings/reminder-window', { days: n });
      setDays(String(data.days));
      toast.success(`Reminder window set to ${data.days} day(s). It applies from the next daily check.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Typography variant="h6">Reminder window</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Services due within this many days are flagged as upcoming and trigger an in-app reminder.
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField label="Days" type="number" size="small" value={days} onChange={(e) => setDays(e.target.value)} inputProps={{ min: 1, max: 30 }} sx={{ width: 120 }} />
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function Notifications() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api
      .get('/notifications')
      .then((res) => {
        setItems(res.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setItems((list) => list.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const visible = filter === 'unread' ? items.filter((n) => !n.readAt) : items;
  const unreadCount = items.filter((n) => !n.readAt).length;

  return (
    <>
      <PageHeader title="Notifications" subtitle="Reminders for upcoming and overdue maintenance." />

      {isAdmin && <ReminderWindowCard />}

      <ToggleButtonGroup value={filter} exclusive size="small" onChange={(_, v) => v && setFilter(v)} sx={{ mb: 2 }}>
        <ToggleButton value="all">All ({items.length})</ToggleButton>
        <ToggleButton value="unread">Unread ({unreadCount})</ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        {visible.map((n, i) => {
          const unread = !n.readAt;
          const busId = n.busId?._id;
          const recordId = n.serviceRecordId?._id;
          return (
            <Box key={n._id}>
              {i > 0 && <Divider />}
              <Box sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'flex-start', bgcolor: unread ? '#EFF6FF' : 'transparent', borderLeft: `4px solid ${n.type === 'OVERDUE' ? colors.red : '#D97706'}` }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Chip label={n.type === 'OVERDUE' ? 'Overdue' : 'Upcoming'} size="small" color={n.type === 'OVERDUE' ? 'error' : 'warning'} />
                    <Typography sx={{ fontWeight: unread ? 700 : 500 }}>{n.title}</Typography>
                  </Stack>
                  <Typography variant="body2">{n.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(n.createdAt)}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {busId && (
                      <Button size="small" component={RouterLink} to={`/buses/${busId}`}>
                        Open bus
                      </Button>
                    )}
                    {busId && recordId && (
                      <Button size="small" component={RouterLink} to={`/service-records?busId=${busId}&highlight=${recordId}`}>
                        Open service record
                      </Button>
                    )}
                  </Stack>
                </Box>
                {unread && (
                  <Button size="small" startIcon={<CheckIcon />} onClick={() => markRead(n._id)}>
                    Mark read
                  </Button>
                )}
              </Box>
            </Box>
          );
        })}
        {!loading && visible.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center', color: 'text.secondary' }}>
            {filter === 'unread' ? 'You are all caught up.' : 'No notifications yet. Reminders appear after the daily check.'}
          </Box>
        )}
      </Card>
    </>
  );
}
