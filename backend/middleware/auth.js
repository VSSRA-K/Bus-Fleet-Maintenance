const AuthService = require('../services/AuthService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Verifies the bearer token and attaches the user to req.user.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) throw new ApiError(401, 'Authentication required');
  req.user = await AuthService.verifyToken(header.slice(7));
  next();
});

// Role check (RBAC) enforced on the backend for every protected action.
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    return next();
  };

module.exports = { authenticate, authorize };
