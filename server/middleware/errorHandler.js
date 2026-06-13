/**
 * notFound — 404 handler for unmatched routes.
 */
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found: ${req.method} ${req.originalUrl}`));
};

/**
 * errorHandler — global error catcher. Always returns { message } so the
 * frontend's err.response?.data?.message works everywhere. Stack traces
 * are hidden in production (NFR — Section 18.4).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server Error';

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    status = 404;
    message = 'Resource not found';
  }
  // Mongoose duplicate key
  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate field value';
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)[0].message;
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
