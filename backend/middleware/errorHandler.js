const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// Central error handler. Never returns stack traces or internal details (SRS 5.3).
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message });

  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier or value' });
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'A record with the same unique value already exists' });
  }

  console.error(err);
  return res.status(500).json({ message: 'Something went wrong on the server. Please try again.' });
};

module.exports = { errorHandler, notFound };
