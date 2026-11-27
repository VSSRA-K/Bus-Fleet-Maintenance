import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import BusIcon from '@mui/icons-material/DirectionsBusFilledOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import BuildIcon from '@mui/icons-material/BuildOutlined';
import BlockIcon from '@mui/icons-material/BlockOutlined';
import WarningIcon from '@mui/icons-material/ReportProblemOutlined';
import WalletIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import api, { errorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { DueStatusChip } from '../components/StatusChips';
import { formatDate, formatINR, monthLabel } from '../utils/format';
import { colors } from '../theme';

const STATUS_COLORS = { Available: colors.green, 'Under Maintenance': '#D97706', 'Out of Service': colors.red };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const { fleet } = data;
  const pieData = Object.entries(fleet.byStatus).map(([name, value]) => ({ name, value }));
  const monthly = data.costByMonth.map((m) => ({ ...m, label: monthLabel(m.month) }));

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Fleet status and upcoming maintenance at a glance." />

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard label="Active buses" value={fleet.total} icon={<BusIcon />} accent={colors.blue} />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            label="Available"
            value={fleet.byStatus.Available}
            hint={`Availability ${fleet.availabilityPercent}% (Available ÷ active buses × 100)`}
            icon={<CheckIcon />}
            accent={colors.green}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard label="Under maintenance" value={fleet.byStatus['Under Maintenance']} icon={<BuildIcon />} accent="#D97706" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard label="Out of service" value={fleet.byStatus['Out of Service']} icon={<BlockIcon />} accent={colors.red} />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            label="Services overdue"
            value={data.overdueCount}
            hint={`${data.upcomingCount} due within ${data.reminderWindowDays} days`}
            icon={<WarningIcon />}
            accent={data.overdueCount ? colors.red : colors.slate}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard label="Total maintenance cost" value={formatINR(data.totalCost)} hint={`${data.recordCount} service records`} icon={<WalletIcon />} accent={colors.teal} />
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fleet status
              </Typography>
              {fleet.total === 0 ? (
                <Typography color="text.secondary">No active buses yet.</Typography>
              ) : (
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                        {pieData.map((d) => (
                          <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance cost — last 12 months
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.border} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} width={56} />
                    <Tooltip formatter={(v) => formatINR(v)} />
                    <Bar dataKey="total" name="Cost" fill={colors.blue} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming and overdue services
              </Typography>
              {data.upcomingServices.length === 0 ? (
                <Typography color="text.secondary">Nothing is due within the next {data.reminderWindowDays} days.</Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Bus</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Due date</TableCell>
                        <TableCell>When</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.upcomingServices.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell>
                            <Link component={RouterLink} to={`/buses/${s.busId}`} underline="hover" sx={{ fontWeight: 600 }}>
                              {s.registrationNo}
                            </Link>
                          </TableCell>
                          <TableCell>{s.serviceType}</TableCell>
                          <TableCell>{formatDate(s.nextDueDate)}</TableCell>
                          <TableCell>
                            {s.daysLeft < 0 ? `${Math.abs(s.daysLeft)} day(s) overdue` : s.daysLeft === 0 ? 'Today' : `In ${s.daysLeft} day(s)`}
                          </TableCell>
                          <TableCell>
                            <DueStatusChip status={s.dueStatus} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
