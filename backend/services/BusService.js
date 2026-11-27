const Bus = require('../models/Bus');
const ServiceRecord = require('../models/ServiceRecord');
const ApiError = require('../utils/ApiError');
const v = require('../utils/validators');
const { BUS_STATUSES, FUEL_TYPES } = require('../models/constants');

const MIN_YEAR = 1980;

const parseBusFields = (body, { partial }) => {
  const out = {};
  const present = (key) => !partial || body[key] !== undefined;

  if (present('registrationNo')) {
    out.registrationNo = v.str(body.registrationNo, 'Registration number', { max: 20 }).toUpperCase();
  }
  if (present('manufacturer')) out.manufacturer = v.str(body.manufacturer, 'Manufacturer', { max: 60 });
  if (present('model')) out.model = v.str(body.model, 'Model', { max: 60 });
  if (present('year')) {
    out.year = v.num(body.year, 'Year', { min: MIN_YEAR, max: new Date().getFullYear() + 1, integer: true });
  }
  if (present('fuelType')) out.fuelType = v.oneOf(body.fuelType, 'Fuel type', FUEL_TYPES);
  if (present('currentOdometerKm')) {
    out.currentOdometerKm = v.num(body.currentOdometerKm, 'Odometer (km)', { min: 0 });
  }
  if (body.status !== undefined || !partial) {
    out.status = v.oneOf(body.status || 'Available', 'Status', BUS_STATUSES);
  }
  return out;
};

const assertRegistrationFree = async (registrationNo, excludeId) => {
  const filter = { registrationNo, isActive: true };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Bus.exists(filter)) {
    throw new ApiError(409, `An active bus with registration number ${registrationNo} already exists`);
  }
};

const create = async (body) => {
  const data = parseBusFields(body, { partial: false });
  await assertRegistrationFree(data.registrationNo);
  return Bus.create({ ...data, isActive: true });
};

const getById = async (id) => {
  v.requireId(id, 'Bus id');
  const bus = await Bus.findById(id);
  if (!bus) throw new ApiError(404, 'Bus not found');
  return bus;
};

const update = async (id, body) => {
  const bus = await getById(id);
  if (!bus.isActive) throw new ApiError(409, 'A deactivated bus cannot be edited');

  const data = parseBusFields(body, { partial: true });
  if (data.registrationNo && data.registrationNo !== bus.registrationNo) {
    await assertRegistrationFree(data.registrationNo, bus._id);
  }
  Object.assign(bus, data);
  await bus.save();
  return bus;
};

// Logical deactivation only: service records and notifications are kept (SRS 4.2.6, Figure 11).
const deactivate = async (id) => {
  const bus = await getById(id);
  if (!bus.isActive) throw new ApiError(409, 'This bus is already deactivated');

  const recordCount = await ServiceRecord.countDocuments({ busId: bus._id });
  bus.deactivate();
  await bus.save();
  return { bus, recordCount };
};

// Search by registration number and filter by operational status (SRS 4.2.7).
const search = async ({ q, status, includeInactive }) => {
  const filter = {};
  if (!includeInactive) filter.isActive = true;
  if (typeof q === 'string' && q.trim()) {
    filter.registrationNo = { $regex: v.escapeRegex(q.trim()), $options: 'i' };
  }
  if (status) filter.status = v.oneOf(status, 'Status', BUS_STATUSES);
  return Bus.find(filter).sort({ registrationNo: 1 });
};

module.exports = { create, getById, update, deactivate, search };
