const Setting = require('../models/Setting');
const { num } = require('../utils/validators');

const KEY = 'global';
const DEFAULT_WINDOW_DAYS = 3; // SRS 4.4.3: reference project documents a three-day setting

const getReminderWindowDays = async () => {
  const setting = await Setting.findOne({ key: KEY });
  return setting ? setting.reminderWindowDays : DEFAULT_WINDOW_DAYS;
};

const setReminderWindowDays = async (value) => {
  const days = num(value, 'Reminder window (days)', { min: 1, max: 30, integer: true });
  const setting = await Setting.findOneAndUpdate(
    { key: KEY },
    { reminderWindowDays: days },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return setting.reminderWindowDays;
};

module.exports = { getReminderWindowDays, setReminderWindowDays, DEFAULT_WINDOW_DAYS };
