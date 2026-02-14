"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFound = exports.errorHandler = exports.AppError = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("../shared/errors/AppError");
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return AppError_1.AppError; } });
const logger_1 = require("../utils/logger");
/**
 * Global error handler middleware
 * Handles all errors in the application and returns consistent error responses
 */
const errorHandler = (err, req, res, next) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code;
    let details;
    // Handle AppError instances
    if (err instanceof AppError_1.AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        details = err.details;
    }
    // Handle Mongoose validation errors
    else if (err instanceof mongoose_1.default.Error.ValidationError) {
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
    }
    else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    }
    // Handle MongoDB duplicate key errors
    else if (err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
        const field = Object.keys(err.keyPattern || {})[0];
        if (field) {
            details = { field, message: `${field} already exists` };
        }
    }
    // Handle MongoDB cast errors (invalid ObjectId, etc.)
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    }
    // Handle Prisma errors (if using Prisma)
    else if (err.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            statusCode = 409;
            message = 'A record with this data already exists';
            code = 'DUPLICATE_ENTRY';
        }
        else if (prismaError.code === 'P2025') {
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
    logger_1.logger.error('Request error', err, {
        statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id,
        details,
    });
    // Send error response
    const response = {
        success: false,
        error: message,
        ...(code && { code }),
        ...(details && { details }),
    };
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development' && !(err instanceof AppError_1.AppError)) {
        response.stack = err.stack;
    }
    res.status(statusCode).json(response);
};
exports.errorHandler = errorHandler;
/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    const error = AppError_1.AppError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFound = notFound;
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
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map