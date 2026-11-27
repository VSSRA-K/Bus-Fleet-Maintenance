const express = require('express');
const BusService = require('../services/BusService');
const ServiceRecordService = require('../services/ServiceRecordService');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

// Any authenticated user can view and search buses; only administrators see deactivated ones.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true' && req.user.role === 'ADMIN';
    res.json(await BusService.search({ q: req.query.q, status: req.query.status, includeInactive }));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await BusService.getById(req.params.id)))
);

router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    await BusService.getById(req.params.id);
    res.json(await ServiceRecordService.historyByBus(req.params.id));
  })
);

router.post(
  '/',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => res.status(201).json(await BusService.create(req.body || {})))
);

router.put(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => res.json(await BusService.update(req.params.id, req.body || {})))
);

router.patch(
  '/:id/deactivate',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => res.json(await BusService.deactivate(req.params.id)))
);

module.exports = router;
