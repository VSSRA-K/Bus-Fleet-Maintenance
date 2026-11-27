const express = require('express');
const ServiceRecordService = require('../services/ServiceRecordService');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await ServiceRecordService.list({ busId: req.query.busId })))
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => res.json(await ServiceRecordService.get(req.params.id)))
);

router.post(
  '/',
  authorize('ADMIN', 'MECHANIC'),
  asyncHandler(async (req, res) => res.status(201).json(await ServiceRecordService.create(req.body || {}, req.user)))
);

router.put(
  '/:id',
  authorize('ADMIN', 'MECHANIC'),
  asyncHandler(async (req, res) => res.json(await ServiceRecordService.update(req.params.id, req.body || {}, req.user)))
);

// Only an administrator may delete a service record (SRS 4.3.3).
router.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    await ServiceRecordService.remove(req.params.id);
    res.json({ message: 'Service record deleted' });
  })
);

module.exports = router;
