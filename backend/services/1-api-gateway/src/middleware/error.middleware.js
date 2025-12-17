/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
      super(message);
      this.statusCode = statusCode;
      this.details = details;
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Not Found handler - for undefined routes
   */
  const notFoundHandler = (req, res, next) => {
    const error = new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`);
    next(error);
  };
  
  /**
   * Global error handler middleware
   */
  const errorHandler = (err, req, res, next) => {
    // Log the error
    console.error('Error:', {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;
  
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      details = err.details || err.message;
    }
  
    if (err.name === 'UnauthorizedError' || err.message === 'jwt malformed') {
      statusCode = 401;
      message = 'Unauthorized';
    }
  
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }
  
    if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }
  
    if (err.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = 'Service temporarily unavailable';
    }
  
    if (err.code === 'ENOTFOUND') {
      statusCode = 503;
      message = 'Service not reachable';
    }
  
    // Proxy errors
    if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
      statusCode = 504;
      message = 'Gateway timeout - upstream service not responding';
    }
  
    // Send error response
    const errorResponse = {
      success: false,
      error: {
        message,
        statusCode,
        ...(details && { details }),
        ...(process.env.NODE_ENV === 'development' && { 
          stack: err.stack,
          originalError: err.message 
        }),
      },
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    };
  
    res.status(statusCode).json(errorResponse);
  };
  
  /**
   * Async handler wrapper to catch errors in async routes
   */
  const asyncHandler = (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };
  
  /**
   * Proxy error handler for http-proxy-middleware
   */
  const proxyErrorHandler = (err, req, res, target) => {
    console.error(`Proxy error for ${target}:`, err.message);
    
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: {
          message: 'Service temporarily unavailable',
          statusCode: 503,
          service: target,
        },
        timestamp: new Date().toISOString(),
      });
    }
  };
  
  module.exports = {
    ApiError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
    proxyErrorHandler,
  };