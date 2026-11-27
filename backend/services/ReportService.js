const Bus = require('../models/Bus');
const ServiceRecord = require('../models/ServiceRecord');
const { BUS_STATUSES } = require('../models/constants');
const { startOfDayUTC, daysBetween, toISODate } = require('../utils/dates');
const { dueRecords } = require('./ServiceRecordService');

const round2 = (n) => Math.round(n * 100) / 100;

// Counts of ACTIVE buses by status. Availability = Available / active buses x 100 (SRS 6.2).
const fleetStatusCounts = async () => {
  const rows = await Bus.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$status', count: { $sum: 1 } } }]);
  const byStatus = Object.fromEntries(BUS_STATUSES.map((s) => [s, 0]));
  rows.forEach((r) => {
    byStatus[r._id] = r.count;
  });
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const availabilityPercent = total ? Math.round((byStatus.Available / total) * 1000) / 10 : 0;
  return { total, byStatus, availabilityPercent };
};

const totalCost = async () => {
  const [row] = await ServiceRecord.aggregate([
    { $group: { _id: null, total: { $sum: '$cost' }, count: { $sum: 1 } } },
  ]);
  return { total: round2(row?.total || 0), recordCount: row?.count || 0 };
};

// Spending for each of the last `months` calendar months (zero-filled), oldest first.
const costByMonth = async (months = 12) => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  const rows = await ServiceRecord.aggregate([
    { $match: { serviceDate: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$serviceDate', timezone: 'UTC' } },
        total: { $sum: '$cost' },
        count: { $sum: 1 },
      },
    },
  ]);
  const map = new Map(rows.map((r) => [r._id, r]));
  const out = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const key = d.toISOString().slice(0, 7);
    const row = map.get(key);
    out.push({ month: key, total: round2(row?.total || 0), count: row?.count || 0 });
  }
  return out;
};

const costByServiceType = async () => {
  const rows = await ServiceRecord.aggregate([
    {
      $group: {
        _id: { $toLower: { $trim: { input: '$serviceType' } } },
        serviceType: { $first: '$serviceType' },
        total: { $sum: '$cost' },
        count: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({ serviceType: r.serviceType, total: round2(r.total), count: r.count }));
};

const costByBus = async () => {
  const rows = await ServiceRecord.aggregate([
    { $group: { _id: '$busId', total: { $sum: '$cost' }, count: { $sum: 1 } } },
    { $lookup: { from: 'buses', localField: '_id', foreignField: '_id', as: 'bus' } },
    { $unwind: '$bus' },
    { $sort: { total: -1 } },
  ]);
  return rows.map((r) => ({
    busId: String(r._id),
    registrationNo: r.bus.registrationNo,
    isActive: r.bus.isActive,
    total: round2(r.total),
    count: r.count,
  }));
};

// Dashboard: fleet totals, status counts, upcoming/overdue services and monthly spend.
const dashboard = async () => {
  const [fleet, cost, monthly, due] = await Promise.all([
    fleetStatusCounts(),
    totalCost(),
    costByMonth(12),
    dueRecords(),
  ]);
  const today = startOfDayUTC();
  const upcomingServices = due.records.map(({ record, dueStatus }) => ({
    id: String(record._id),
    busId: String(record.busId._id),
    registrationNo: record.busId.registrationNo,
    serviceType: record.serviceType,
    nextDueDate: toISODate(record.nextDueDate),
    daysLeft: daysBetween(today, record.nextDueDate),
    dueStatus,
  }));
  return {
    fleet,
    totalCost: cost.total,
    recordCount: cost.recordCount,
    costByMonth: monthly,
    reminderWindowDays: due.windowDays,
    overdueCount: upcomingServices.filter((s) => s.dueStatus === 'OVERDUE').length,
    upcomingCount: upcomingServices.filter((s) => s.dueStatus === 'UPCOMING').length,
    upcomingServices,
  };
};

const costs = async () => {
  const [cost, byMonth, byServiceType, byBus, fleet] = await Promise.all([
    totalCost(),
    costByMonth(12),
    costByServiceType(),
    costByBus(),
    fleetStatusCounts(),
  ]);
  return { totalCost: cost.total, recordCount: cost.recordCount, byMonth, byServiceType, byBus, fleet };
};

module.exports = { fleetStatusCounts, costByMonth, costByServiceType, costByBus, dashboard, costs };
