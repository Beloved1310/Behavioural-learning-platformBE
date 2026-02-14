/**
 * Application Error Class
 * Custom error class for operational errors that can be handled gracefully
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
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
  static badRequest(message: string, code?: string): AppError {
    return new AppError(message, 400, code);
  }

  /**
   * Create an unauthorized error (401)
   */
  static unauthorized(message: string = 'Unauthorized', code?: string): AppError {
    return new AppError(message, 401, code);
  }

  /**
   * Create a forbidden error (403)
   */
  static forbidden(message: string = 'Forbidden', code?: string): AppError {
    return new AppError(message, 403, code);
  }

  /**
   * Create a not found error (404)
   */
  static notFound(message: string = 'Resource not found', code?: string): AppError {
    return new AppError(message, 404, code);
  }

  /**
   * Create a conflict error (409)
   */
  static conflict(message: string, code?: string): AppError {
    return new AppError(message, 409, code);
  }

  /**
   * Create a validation error (422)
   */
  static validation(message: string, code?: string, details?: any): AppError {
    return new AppError(message, 422, code, details);
  }

  /**
   * Create an internal server error (500)
   */
  static internal(message: string = 'Internal server error', code?: string): AppError {
    return new AppError(message, 500, code);
  }
}
