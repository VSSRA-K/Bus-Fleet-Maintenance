const express = require('express');
const AuthService = require('../services/AuthService');
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/register',
  asyncHandler(async (req, res) => res.status(201).json(await AuthService.register(req.body || {})))
);

router.post(
  '/login',
  asyncHandler(async (req, res) => res.json(await AuthService.login(req.body || {})))
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => res.json(await AuthService.logout()))
);

router.get('/me', authenticate, (req, res) => res.json(AuthService.publicUser(req.user)));

module.exports = router;
