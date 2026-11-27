const mongoose = require('mongoose');
const Bus = require('../models/Bus');
const ServiceRecord = require('../models/ServiceRecord');
const ApiError = require('../utils/ApiError');
const v = require('../utils/validators');
const { SERVICE_CATEGORIES } = require('../models/constants');
const { startOfDayUTC, addDays } = require('../utils/dates');
const { getReminderWindowDays } = require('./SettingsService');

const BUS_FIELDS = 'registrationNo manufacturer model status isActive';
const populateRecord = (query) =>
  query.populate('busId', BUS_FIELDS).populate('createdBy', 'name').populate('updatedBy', 'name');

// Adds dueStatus to each record. Superseded records (an older service of the same type on the
// same bus has since been repeated) get dueStatus = null and superseded = true.
const decorate = async (records, busMatch = {}) => {
  const [windowDays, latest] = await Promise.all([
    getReminderWindowDays(),
    ServiceRecord.latestIds(busMatch),
  ]);
  const today = startOfDayUTC();
  return records.map((rec) => {
    const isLatest = latest.has(String(rec._id));
    const plain = rec.toJSON();
    plain.superseded = !isLatest;
    plain.dueStatus = isLatest ? rec.getDueStatus(today, windowDays) : null;
    return plain;
  });
};

const parseRecordFields = (body, { partial }) => {
  const out = {};
  const present = (key) => !partial || body[key] !== undefined;

  if (present('serviceType')) out.serviceType = v.str(body.serviceType, 'Service type', { max: 100 });
  if (present('category')) out.category = v.oneOf(body.category, 'Category', SERVICE_CATEGORIES);
  if (present('description')) out.description = v.str(body.description, 'Description', { required: false, max: 1000 });
  if (present('serviceDate')) out.serviceDate = v.date(body.serviceDate, 'Service date');
  if (present('odometerKm')) out.odometerKm = v.num(body.odometerKm, 'Odometer reading (km)', { min: 0 });
  if (present('cost')) out.cost = v.num(body.cost, 'Cost (INR)', { min: 0 });
  if (present('nextDueDate')) out.nextDueDate = v.date(body.nextDueDate, 'Next due date', { required: false });
  return out;
};

const assertDueAfterService = (serviceDate, nextDueDate) => {
  if (nextDueDate && serviceDate && nextDueDate < serviceDate) {
    throw new ApiError(400, 'Next due date cannot be earlier than the service date');
  }
};

const create = async (body, user) => {
  const busId = v.requireId(body.busId, 'Bus');
  const bus = await Bus.findById(busId);
  if (!bus) throw new ApiError(404, 'Bus not found');
  if (!bus.isActive) throw new ApiError(409, 'Cannot add a service record to a deactivated bus');

  const data = parseRecordFields(body, { partial: false });
  assertDueAfterService(data.serviceDate, data.nextDueDate);

  const record = await ServiceRecord.create({ ...data, busId: bus._id, createdBy: user._id });

  // Sequence 3: raise the bus odometer when the recorded reading is higher.
  if (data.odometerKm > bus.currentOdometerKm) {
    bus.updateOdometer(data.odometerKm);
    await bus.save();
  }
  return get(record._id);
};

const update = async (id, body, user) => {
  v.requireId(id, 'Service record id');
  const record = await ServiceRecord.findById(id);
  if (!record) throw new ApiError(404, 'Service record not found');

  const data = parseRecordFields(body, { partial: true });
  assertDueAfterService(data.serviceDate ?? record.serviceDate, data.nextDueDate === undefined ? record.nextDueDate : data.nextDueDate);

  Object.assign(record, data);
  record.updatedBy = user._id;
  await record.save();

  if (data.odometerKm !== undefined) {
    const bus = await Bus.findById(record.busId);
    if (bus && data.odometerKm > bus.currentOdometerKm) {
      bus.updateOdometer(data.odometerKm);
      await bus.save();
    }
  }
  return get(record._id);
};

// Deletion is restricted to administrators by the route (SRS 4.3.3).
const remove = async (id) => {
  v.requireId(id, 'Service record id');
  const record = await ServiceRecord.findById(id);
  if (!record) throw new ApiError(404, 'Service record not found');
  await record.deleteOne();
};

const get = async (id) => {
  v.requireId(id, 'Service record id');
  const record = await populateRecord(ServiceRecord.findById(id));
  if (!record) throw new ApiError(404, 'Service record not found');
  const [decorated] = await decorate([record], { busId: record.busId._id });
  return decorated;
};

const list = async ({ busId }) => {
  const filter = {};
  let busMatch = {};
  if (busId) {
    v.requireId(busId, 'Bus');
    filter.busId = busId;
    busMatch = { busId: new mongoose.Types.ObjectId(busId) };
  }
  const records = await populateRecord(ServiceRecord.find(filter).sort({ serviceDate: -1, createdAt: -1 }));
  return decorate(records, busMatch);
};

// Chronological (oldest first) service history of one bus (SRS 4.3.5).
const historyByBus = async (busId) => {
  v.requireId(busId, 'Bus');
  const records = await populateRecord(ServiceRecord.find({ busId }).sort({ serviceDate: 1, createdAt: 1 }));
  return decorate(records, { busId: new mongoose.Types.ObjectId(busId) });
};

// Live records (latest per bus + service type) on active buses that are overdue or due within
// the reminder window, soonest first. Shared by the reminder job and the dashboard.
const dueRecords = async (today = startOfDayUTC()) => {
  const windowDays = await getReminderWindowDays();
  const windowEnd = addDays(today, windowDays);
  const latest = await ServiceRecord.latestIds();
  if (latest.size === 0) return { windowDays, records: [] };

  const candidates = await ServiceRecord.find({
    _id: { $in: [...latest] },
    nextDueDate: { $ne: null, $lte: windowEnd },
  })
    .sort({ nextDueDate: 1 })
    .populate('busId', BUS_FIELDS);

  const records = candidates
    .filter((rec) => rec.busId && rec.busId.isActive)
    .map((rec) => ({ record: rec, dueStatus: rec.getDueStatus(today, windowDays) }))
    .filter((r) => r.dueStatus !== 'SCHEDULED');
  return { windowDays, records };
};

module.exports = { create, update, remove, get, list, historyByBus, dueRecords };
