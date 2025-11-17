// middleware/asyncErrorHandler.js
/**
 * Async Error Handler Middleware
 * Catches errors from async functions and passes them to Express error handler
 */
const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncErrorHandler;
