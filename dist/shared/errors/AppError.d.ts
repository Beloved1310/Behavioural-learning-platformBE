/**
 * Application Error Class
 * Custom error class for operational errors that can be handled gracefully
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    readonly details?: any;
    constructor(message: string, statusCode?: number, code?: string, details?: any);
    /**
     * Create a bad request error (400)
     */
    static badRequest(message: string, code?: string): AppError;
    /**
     * Create an unauthorized error (401)
     */
    static unauthorized(message?: string, code?: string): AppError;
    /**
     * Create a forbidden error (403)
     */
    static forbidden(message?: string, code?: string): AppError;
    /**
     * Create a not found error (404)
     */
    static notFound(message?: string, code?: string): AppError;
    /**
     * Create a conflict error (409)
     */
    static conflict(message: string, code?: string): AppError;
    /**
     * Create a validation error (422)
     */
    static validation(message: string, code?: string, details?: any): AppError;
    /**
     * Create an internal server error (500)
     */
    static internal(message?: string, code?: string): AppError;
}
//# sourceMappingURL=AppError.d.ts.map