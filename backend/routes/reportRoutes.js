const express = require('express');
const ReportService = require('../services/ReportService');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => res.json(await ReportService.dashboard()))
);

router.get(
  '/costs',
  asyncHandler(async (req, res) => res.json(await ReportService.costs()))
);

module.exports = router;
