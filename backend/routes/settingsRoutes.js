const express = require('express');
const SettingsService = require('../services/SettingsService');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/reminder-window',
  asyncHandler(async (req, res) => res.json({ days: await SettingsService.getReminderWindowDays() }))
);

// "Configure Reminder Window" is an administrator use case.
router.put(
  '/reminder-window',
  authorize('ADMIN'),
  asyncHandler(async (req, res) =>
    res.json({ days: await SettingsService.setReminderWindowDays((req.body || {}).days) })
  )
);

module.exports = router;
