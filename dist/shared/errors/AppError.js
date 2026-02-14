"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
/**
 * Application Error Class
 * Custom error class for operational errors that can be handled gracefully
 */
class AppError extends Error {
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.code = code;
        this.details = details;
        this.name = this.constructor.name;
        // Maintains proper stack trace for where error was thrown (V8 only)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Create a bad request error (400)
     */
    static badRequest(message, code) {
        return new AppError(message, 400, code);
    }
    /**
     * Create an unauthorized error (401)
     */
    static unauthorized(message = 'Unauthorized', code) {
        return new AppError(message, 401, code);
    }
    /**
     * Create a forbidden error (403)
     */
    static forbidden(message = 'Forbidden', code) {
        return new AppError(message, 403, code);
    }
    /**
     * Create a not found error (404)
     */
    static notFound(message = 'Resource not found', code) {
        return new AppError(message, 404, code);
    }
    /**
     * Create a conflict error (409)
     */
    static conflict(message, code) {
        return new AppError(message, 409, code);
    }
    /**
     * Create a validation error (422)
     */
    static validation(message, code, details) {
        return new AppError(message, 422, code, details);
    }
    /**
     * Create an internal server error (500)
     */
    static internal(message = 'Internal server error', code) {
        return new AppError(message, 500, code);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=AppError.js.map