import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/AppError';
export { AppError };
/**
 * Global error handler middleware
 * Handles all errors in the application and returns consistent error responses
 */
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, next: NextFunction) => void;
/**
 * 404 Not Found handler
 */
export declare const notFound: (req: Request, res: Response, next: NextFunction) => void;
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
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map