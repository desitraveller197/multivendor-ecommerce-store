/**
 * Wraps an async Express handler so rejected promises are forwarded to next()
 * and caught by the global error handler — removes per-controller try/catch.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
