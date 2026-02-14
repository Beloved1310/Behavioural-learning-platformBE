import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../utils/logger';

// Re-export AppError for backward compatibility
export { AppError };

/**
 * Global error handler middleware
 * Handles all errors in the application and returns consistent error responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any;

  // Handle AppError instances
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  }
  // Handle Mongoose validation errors
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }
  // Handle MongoDB duplicate key errors
  else if ((err as any).code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ENTRY';
    const field = Object.keys((err as any).keyPattern || {})[0];
    if (field) {
      details = { field, message: `${field} already exists` };
    }
  }
  // Handle MongoDB cast errors (invalid ObjectId, etc.)
  else if ((err as any).name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  }
  // Handle Prisma errors (if using Prisma)
  else if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this data already exists';
      code = 'DUPLICATE_ENTRY';
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
      code = 'NOT_FOUND';
    }
  }
  // Handle unknown errors
  else {
    message = err.message || message;
  }

  // Log error
  logger.error('Request error', err, {
    statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    details,
  });

  // Send error response
  const response: any = {
    success: false,
    error: message,
    ...(code && { code }),
    ...(details && { details }),
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && !(err instanceof AppError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = AppError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

/**
 * Async handler wrapper for Express route handlers
 * Automatically catches errors and passes them to error handling middleware
 *
 * @example
 * ```typescript
 * export const myHandler = asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   res.json({ success: true, data });
 * });
 * ```
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
