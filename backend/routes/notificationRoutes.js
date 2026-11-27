const express = require('express');
const NotificationService = require('../services/NotificationService');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await NotificationService.listForUser(req.user._id)))
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => res.json(await NotificationService.markRead(req.params.id, req.user._id)))
);

module.exports = router;
