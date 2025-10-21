// Error response formatter
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  let { statusCode, message, details } = err;

  // Default to 500 if no status code
  statusCode = statusCode || 500;

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        details = err.detail;
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference to related resource';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field is missing';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Invalid input format';
        break;
      default:
        console.error('Database error:', err);
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 handler
const notFound = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
};
