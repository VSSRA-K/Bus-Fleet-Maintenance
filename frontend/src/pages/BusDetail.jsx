import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import api, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import BusFormDialog from '../components/BusFormDialog';
import ServiceFormDialog from '../components/ServiceFormDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import { BusStatusChip, DueStatusChip } from '../components/StatusChips';
import { formatDate, formatINR, formatKm } from '../utils/format';

function Detail({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
    </Box>
  );
}

export default function BusDetail() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const toast = useToast();

  const [bus, setBus] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busFormOpen, setBusFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get(`/buses/${id}`), api.get(`/buses/${id}/history`)])
      .then(([busRes, historyRes]) => {
        setBus(busRes.data);
        setHistory(historyRes.data);
        setError('');
      })
      .catch((err) => setError(errorMessage(err)));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!bus) return <CircularProgress />;

  const totalCost = history.reduce((sum, r) => sum + r.cost, 0);

  return (
    <>
      <Button component={RouterLink} to="/buses" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>
        All buses
      </Button>
      <PageHeader
        title={bus.registrationNo}
        subtitle={`${bus.manufacturer} ${bus.model} · ${bus.year}`}
        actions={
          <>
            {isAdmin && bus.isActive && (
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setBusFormOpen(true)}>
                Edit bus
              </Button>
            )}
            {bus.isActive && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingRecord(null);
                  setServiceFormOpen(true);
                }}
              >
                Record service
              </Button>
            )}
          </>
        }
      />

      {!bus.isActive && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This bus is deactivated. Its history is kept for reference, but it can no longer be edited or serviced.
        </Alert>
      )}

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={6} md>
              <Detail label="Status" value={<BusStatusChip status={bus.status} />} />
            </Grid>
            <Grid item xs={6} md>
              <Detail label="Fuel type" value={bus.fuelType} />
            </Grid>
            <Grid item xs={6} md>
              <Detail label="Odometer" value={formatKm(bus.currentOdometerKm)} />
            </Grid>
            <Grid item xs={6} md>
              <Detail label="Services recorded" value={history.length} />
            </Grid>
            <Grid item xs={12} md>
              <Detail label="Total cost" value={formatINR(totalCost)} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Typography variant="h6">Maintenance history</Typography>
          <Typography variant="body2" color="text.secondary">
            In chronological order, oldest first.{' '}
            <Link component={RouterLink} to={`/service-records?busId=${bus._id}`} underline="hover">
              Open in Service Records
            </Link>
          </Typography>
        </CardContent>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Odometer</TableCell>
                <TableCell align="right">Cost</TableCell>
                <TableCell>Next due</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell>{formatDate(r.serviceDate)}</TableCell>
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
                  <TableCell align="right">
                    {bus.isActive && (
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          aria-label="Edit service record"
                          onClick={() => {
                            setEditingRecord(r);
                            setServiceFormOpen(true);
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
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No services recorded for this bus yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <BusFormDialog
        open={busFormOpen}
        bus={bus}
        onClose={() => setBusFormOpen(false)}
        onSaved={() => {
          setBusFormOpen(false);
          load();
        }}
      />
      <ServiceFormDialog
        open={serviceFormOpen}
        record={editingRecord}
        buses={[bus]}
        fixedBusId={bus._id}
        onClose={() => setServiceFormOpen(false)}
        onSaved={() => {
          setServiceFormOpen(false);
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
