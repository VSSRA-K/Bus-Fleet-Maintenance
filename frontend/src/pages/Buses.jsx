import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
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
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/PowerSettingsNewOutlined';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import BusFormDialog from '../components/BusFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { BusStatusChip } from '../components/StatusChips';
import { BUS_STATUSES, formatKm } from '../utils/format';

export default function Buses() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDeactivate, setToDeactivate] = useState(null);
  const [busy, setBusy] = useState(false);

  // Debounce the search box so each keystroke does not hit the API.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (query) params.q = query;
    if (status) params.status = status;
    if (isAdmin && showInactive) params.includeInactive = true;
    api
      .get('/buses', { params })
      .then((res) => {
        setBuses(res.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [query, status, showInactive, isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (bus) => {
    setEditing(bus);
    setFormOpen(true);
  };

  const confirmDeactivate = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/buses/${toDeactivate._id}/deactivate`);
      toast.success(`${toDeactivate.registrationNo} deactivated. ${data.recordCount} service record(s) retained.`);
      setToDeactivate(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Buses"
        subtitle="Search the fleet and open a bus to see its maintenance history."
        actions={
          isAdmin && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              Add bus
            </Button>
          )
        }
      />

      <Card sx={{ p: 2, mb: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            placeholder="Search by registration number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ flexGrow: 1, maxWidth: { md: 380 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} size="small" sx={{ minWidth: 200 }}>
            <MenuItem value="">All statuses</MenuItem>
            {BUS_STATUSES.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          {isAdmin && (
            <FormControlLabel
              control={<Switch checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />}
              label="Show deactivated"
            />
          )}
        </Stack>
      </Card>

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
                <TableCell>Registration</TableCell>
                <TableCell>Bus</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Fuel</TableCell>
                <TableCell align="right">Odometer</TableCell>
                <TableCell>Status</TableCell>
                {isAdmin && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {buses.map((bus) => (
                <TableRow
                  key={bus._id}
                  hover
                  sx={{ cursor: 'pointer', opacity: bus.isActive ? 1 : 0.55 }}
                  onClick={() => navigate(`/buses/${bus._id}`)}
                >
                  <TableCell>
                    <Link component={RouterLink} to={`/buses/${bus._id}`} underline="hover" sx={{ fontWeight: 700 }} onClick={(e) => e.stopPropagation()}>
                      {bus.registrationNo}
                    </Link>
                    {!bus.isActive && (
                      <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        (deactivated)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {bus.manufacturer} {bus.model}
                  </TableCell>
                  <TableCell>{bus.year}</TableCell>
                  <TableCell>{bus.fuelType}</TableCell>
                  <TableCell align="right">{formatKm(bus.currentOdometerKm)}</TableCell>
                  <TableCell>
                    <BusStatusChip status={bus.status} />
                  </TableCell>
                  {isAdmin && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      {bus.isActive && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(bus)} aria-label="Edit bus">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deactivate">
                            <IconButton size="small" color="error" onClick={() => setToDeactivate(bus)} aria-label="Deactivate bus">
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {!loading && buses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No buses match your search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <BusFormDialog
        open={formOpen}
        bus={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title="Deactivate bus?"
        message={`${toDeactivate?.registrationNo} will be removed from the active fleet. Its service history and notifications are kept.`}
        confirmLabel="Deactivate"
        busy={busy}
        onConfirm={confirmDeactivate}
        onClose={() => setToDeactivate(null)}
      />
    </>
  );
}
