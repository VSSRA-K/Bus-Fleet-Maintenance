import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  IconButton,
  Link,
  MenuItem,
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
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import ServiceFormDialog from '../components/ServiceFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { DueStatusChip } from '../components/StatusChips';
import { formatDate, formatINR, formatKm } from '../utils/format';

export default function ServiceRecords() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const busFilter = searchParams.get('busId') || '';
  const highlightId = searchParams.get('highlight') || '';

  const [buses, setBuses] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api
      .get('/buses', { params: isAdmin ? { includeInactive: true } : {} })
      .then((res) => setBuses(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [isAdmin]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/service-records', { params: busFilter ? { busId: busFilter } : {} })
      .then((res) => {
        setRecords(res.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [busFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const changeBusFilter = (value) => {
    const next = new URLSearchParams();
    if (value) next.set('busId', value);
    setSearchParams(next);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/service-records/${toDelete._id}`);
      toast.success('Service record deleted');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const activeBuses = buses.filter((b) => b.isActive);

  return (
    <>
      <PageHeader
        title="Service Records"
        subtitle="Completed services, costs and next due dates across the fleet."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Record service
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2.5 }}>
        <TextField select label="Filter by bus" value={busFilter} onChange={(e) => changeBusFilter(e.target.value)} size="small" sx={{ minWidth: 280 }}>
          <MenuItem value="">All buses</MenuItem>
          {buses.map((b) => (
            <MenuItem key={b._id} value={b._id}>
              {b.registrationNo}
              {!b.isActive ? ' (deactivated)' : ''}
            </MenuItem>
          ))}
        </TextField>
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
                <TableCell>Date</TableCell>
                <TableCell>Bus</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Odometer</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Next due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Recorded by</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((r) => {
                const bus = r.busId;
                return (
                  <TableRow key={r._id} hover selected={r._id === highlightId}>
                    <TableCell>{formatDate(r.serviceDate)}</TableCell>
                    <TableCell>
                      <Link component={RouterLink} to={`/buses/${bus._id}`} underline="hover" sx={{ fontWeight: 700 }}>
                        {bus.registrationNo}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{r.serviceType}</Typography>
                      {r.description && (
                        <Typography variant="caption" color="text.secondary">
                          {r.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell align="right">{formatKm(r.odometerKm)}</TableCell>
                    <TableCell align="right">{formatINR(r.cost)}</TableCell>
                    <TableCell>{formatDate(r.nextDueDate)}</TableCell>
                    <TableCell>
                      <DueStatusChip status={r.dueStatus} hasDueDate={Boolean(r.nextDueDate)} />
                    </TableCell>
                    <TableCell>{r.createdBy?.name || '—'}</TableCell>
                    <TableCell align="right">
                      {bus.isActive && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label="Edit service record"
                            onClick={() => {
                              setEditing(r);
                              setFormOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {isAdmin && (
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" aria-label="Delete service record" onClick={() => setToDelete(r)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No service records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <ServiceFormDialog
        open={formOpen}
        record={editing}
        buses={editing ? buses : activeBuses}
        fixedBusId={!editing && busFilter && activeBuses.some((b) => b._id === busFilter) ? busFilter : undefined}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          load();
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete service record?"
        message={`This permanently deletes the ${toDelete?.serviceType} record from ${formatDate(toDelete?.serviceDate)}.`}
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
