const mongoose = require('mongoose');

// Single "global" document holding administrator-configurable settings.
const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  reminderWindowDays: { type: Number, required: true, min: 1, max: 30, default: 3 },
});

module.exports = mongoose.model('Setting', settingSchema);
