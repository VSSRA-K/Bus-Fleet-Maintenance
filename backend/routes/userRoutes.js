const express = require('express');
const UserService = require('../services/UserService');
const { authenticate, authorize } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Account and role administration is limited to administrators (SRS 4.1.7).
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/',
  asyncHandler(async (req, res) => res.json(await UserService.list()))
);

router.post(
  '/',
  asyncHandler(async (req, res) => res.status(201).json(await UserService.create(req.body || {})))
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => res.json(await UserService.update(req.params.id, req.body || {}, req.user._id)))
);

module.exports = router;
