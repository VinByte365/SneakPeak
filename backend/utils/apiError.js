// utils/apiError.js
/**
 * Custom API Error Class
 * Extends the native Error class with status code and consistent error formatting
 */
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode < 100 ? 'FAIL' : statusCode >= 100 && statusCode < 300 ? 'SUCCESS' : 'ERROR';
    
    // Error stack for development
    if (process.env.NODE_ENV === 'development') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = ApiError;
