// Loads fictional sample data for demos and testing: npm run seed
// WARNING: this deletes all existing users, buses, service records, notifications and settings.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Bus = require('../models/Bus');
const ServiceRecord = require('../models/ServiceRecord');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const { startOfDayUTC, addDays } = require('../utils/dates');
const { runDailyCheck } = require('../services/ReminderService');

const daysFromToday = (n) => addDays(startOfDayUTC(), n);

const USERS = [
  { name: 'Anita Menon', email: 'admin@fleet.test', password: 'Admin@1234', role: 'ADMIN' },
  { name: 'Rahul Nair', email: 'mechanic1@fleet.test', password: 'Mech@12345', role: 'MECHANIC' },
  { name: 'Suresh Kumar', email: 'mechanic2@fleet.test', password: 'Mech@12345', role: 'MECHANIC' },
];

// Fictional registration numbers only.
const BUSES = [
  { registrationNo: 'KL-99-FA-0001', manufacturer: 'Ashok Leyland', model: 'Viking', year: 2019, fuelType: 'Diesel', currentOdometerKm: 182400, status: 'Available' },
  { registrationNo: 'KL-99-FA-0002', manufacturer: 'Tata', model: 'Starbus', year: 2020, fuelType: 'Diesel', currentOdometerKm: 154300, status: 'Available' },
  { registrationNo: 'KL-99-FA-0003', manufacturer: 'Eicher', model: 'Skyline Pro', year: 2018, fuelType: 'Diesel', currentOdometerKm: 201900, status: 'Under Maintenance' },
  { registrationNo: 'KL-99-FA-0004', manufacturer: 'Tata', model: 'Starbus Ultra', year: 2022, fuelType: 'Diesel', currentOdometerKm: 76500, status: 'Available' },
  { registrationNo: 'KL-99-FA-0005', manufacturer: 'Ashok Leyland', model: 'Lynx Smart', year: 2021, fuelType: 'CNG', currentOdometerKm: 98200, status: 'Available' },
  { registrationNo: 'KL-99-FA-0006', manufacturer: 'Force', model: 'Traveller', year: 2017, fuelType: 'Diesel', currentOdometerKm: 241000, status: 'Out of Service' },
  { registrationNo: 'KL-99-FA-0007', manufacturer: 'Switch', model: 'EiV12', year: 2023, fuelType: 'Electric', currentOdometerKm: 31200, status: 'Available' },
  { registrationNo: 'KL-99-FA-0008', manufacturer: 'Mahindra', model: 'Cruzio', year: 2016, fuelType: 'Diesel', currentOdometerKm: 268800, status: 'Available', isActive: false },
];

// [bus index, service type, category, description, days ago, cost INR, next due in N days (null = none), mechanic index]
const RECORDS = [
  [0, 'Engine Oil Change', 'Preventive', 'Engine oil and filter replaced.', 190, 6200, -10, 1],
  [0, 'Engine Oil Change', 'Preventive', 'Engine oil and filter replaced.', 12, 6400, 80, 1],
  [0, 'Brake Inspection', 'Inspection', 'Brake pads and drums inspected.', 95, 1500, 2, 2],
  [0, 'Tyre Rotation', 'Preventive', 'Rotated and balanced all tyres.', 60, 3200, 30, 2],
  [1, 'Engine Oil Change', 'Preventive', 'Engine oil and filter replaced.', 100, 6100, -4, 1],
  [1, 'Air Filter Replacement', 'Preventive', 'Replaced air filter element.', 150, 2300, 45, 2],
  [1, 'Clutch Repair', 'Repair', 'Clutch plate and pressure plate replaced.', 40, 28500, null, 1],
  [2, 'Suspension Repair', 'Repair', 'Front leaf springs and bushes replaced.', 8, 41200, 120, 2],
  [2, 'Engine Oil Change', 'Preventive', 'Engine oil and filter replaced.', 85, 6300, 1, 1],
  [2, 'Coolant Flush', 'Preventive', 'Radiator flushed and refilled.', 170, 2800, -20, 1],
  [3, 'General Inspection', 'Inspection', 'Quarterly safety inspection.', 70, 1800, 20, 2],
  [3, 'Engine Oil Change', 'Preventive', 'Engine oil and filter replaced.', 55, 6000, 35, 2],
  [4, 'CNG Cylinder Inspection', 'Inspection', 'Cylinder and fuel line inspection.', 110, 4500, 3, 1],
  [4, 'Tyre Rotation', 'Preventive', 'Rotated and balanced all tyres.', 30, 3000, 60, 1],
  [4, 'Battery Check', 'Inspection', 'Battery load test and terminal cleaning.', 200, 900, null, 2],
  [5, 'Gearbox Repair', 'Repair', 'Gearbox overhaul; awaiting road test.', 20, 67500, null, 2],
  [5, 'Brake Inspection', 'Inspection', 'Brake system inspection.', 140, 1500, -30, 1],
  [6, 'Battery Pack Health Check', 'Inspection', 'Traction battery diagnostics.', 45, 5200, 50, 2],
  [6, 'Tyre Rotation', 'Preventive', 'Rotated and balanced all tyres.', 15, 3100, 75, 1],
  [7, 'Engine Oil Change', 'Preventive', 'Last service before the bus was deactivated.', 210, 6000, null, 1],
  [7, 'Brake Inspection', 'Inspection', 'Final brake inspection.', 215, 1500, null, 2],
];

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Bus.deleteMany({}),
    ServiceRecord.deleteMany({}),
    Notification.deleteMany({}),
    Setting.deleteMany({}),
  ]);
  await Bus.syncIndexes();

  console.log('Creating users...');
  const users = [];
  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    users.push(await User.create({ name: u.name, email: u.email, passwordHash, role: u.role }));
  }
  const mechanics = [users[1], users[2]];

  console.log('Creating buses...');
  const buses = await Bus.insertMany(BUSES);

  console.log('Creating service records...');
  for (const [busIdx, serviceType, category, description, daysAgo, cost, dueIn, mechIdx] of RECORDS) {
    const bus = buses[busIdx];
    const author = mechanics[mechIdx - 1];
    await ServiceRecord.create({
      busId: bus._id,
      serviceType,
      category,
      description,
      serviceDate: daysFromToday(-daysAgo),
      odometerKm: Math.max(0, bus.currentOdometerKm - daysAgo * 70),
      cost,
      nextDueDate: dueIn === null ? null : daysFromToday(dueIn),
      createdBy: author._id,
    });
  }

  await Setting.create({ key: 'global', reminderWindowDays: 3 });

  console.log('Running the reminder check to create sample notifications...');
  await runDailyCheck();

  console.log('\nSeed completed. Test accounts (fictional):');
  USERS.forEach((u) => console.log(`  ${u.role.padEnd(8)} ${u.email}  /  ${u.password}`));
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
