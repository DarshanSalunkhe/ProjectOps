import config from '../config/index.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  if (config.env === 'development') {
    console.error('Error:', err);
  }

  // PostgreSQL unique constraint violation
  if (err.code === '23505') {
    const field = err.detail?.match(/\(([^)]+)\)/)?.[1] || 'field';
    error.message = `A record with this ${field} already exists`;
    error.statusCode = 400;
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    error.message = 'Referenced resource does not exist';
    error.statusCode = 400;
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    error.message = 'Required field is missing';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = err.message;
    error.statusCode = 400;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    error: config.env === 'development' ? {
      stack: err.stack,
      code: err.code,
      detail: err.detail
    } : null
  });
};

const notFound = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export { AppError, errorHandler, notFound, asyncHandler };
