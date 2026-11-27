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
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import WalletIcon from '@mui/icons-material/CurrencyRupeeOutlined';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import api, { errorMessage } from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { formatINR, monthLabel } from '../utils/format';
import { chartColors, colors } from '../theme';

export default function Reports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/reports/costs')
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <CircularProgress />;

  const monthly = data.byMonth.map((m) => ({ ...m, label: monthLabel(m.month) }));
  const busChart = data.byBus.slice(0, 10);

  return (
    <>
      <PageHeader title="Reports" subtitle="Maintenance expenditure by month, service type and bus. All costs in INR." />

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <StatCard label="Total maintenance cost" value={formatINR(data.totalCost)} hint={`Sum of ${data.recordCount} recorded service costs`} icon={<WalletIcon />} accent={colors.teal} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <StatCard
            label="Fleet availability"
            value={`${data.fleet.availabilityPercent}%`}
            hint={`Available buses ÷ active buses × 100 (${data.fleet.byStatus.Available} of ${data.fleet.total}, current snapshot)`}
            icon={<CheckIcon />}
            accent={colors.green}
          />
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by month (last 12 months)
              </Typography>
              <Box sx={{ height: 300 }}>
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

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by service type
              </Typography>
              {data.byServiceType.length === 0 ? (
                <Typography color="text.secondary">No service records yet.</Typography>
              ) : (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={data.byServiceType} dataKey="total" nameKey="serviceType" outerRadius={100}>
                        {data.byServiceType.map((d, i) => (
                          <Cell key={d.serviceType} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatINR(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Spending by bus (top 10)
              </Typography>
              {busChart.length === 0 ? (
                <Typography color="text.secondary">No service records yet.</Typography>
              ) : (
                <Box sx={{ height: 320 }}>
                  <ResponsiveContainer>
                    <BarChart data={busChart} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.border} />
                      <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <YAxis type="category" dataKey="registrationNo" tick={{ fontSize: 12 }} width={110} />
                      <Tooltip formatter={(v) => formatINR(v)} />
                      <Bar dataKey="total" name="Cost" fill={colors.teal} radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent sx={{ pb: 0 }}>
              <Typography variant="h6">Bus-wise maintenance summary</Typography>
            </CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Bus</TableCell>
                    <TableCell align="right">Services</TableCell>
                    <TableCell align="right">Total cost</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.byBus.map((b) => (
                    <TableRow key={b.busId} hover>
                      <TableCell>
                        <Link component={RouterLink} to={`/buses/${b.busId}`} underline="hover" sx={{ fontWeight: 700 }}>
                          {b.registrationNo}
                        </Link>
                        {!b.isActive && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            (deactivated)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{b.count}</TableCell>
                      <TableCell align="right">{formatINR(b.total)}</TableCell>
                    </TableRow>
                  ))}
                  {data.byBus.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                        No service records yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
