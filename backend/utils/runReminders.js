// Runs the daily reminder check once, right now (useful for demos/testing): npm run reminders
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { runDailyCheck } = require('../services/ReminderService');

(async () => {
  await connectDB();
  const summary = await runDailyCheck();
  console.log('Reminder check finished:', summary);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
