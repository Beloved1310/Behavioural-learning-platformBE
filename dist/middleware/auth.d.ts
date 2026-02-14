import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: UserRole;
        subscriptionTier: string;
    };
}
/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * Authorization middleware factory
 * Checks if the authenticated user has one of the required roles
 *
 * @param roles - Array of allowed roles
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * router.get('/admin', authenticate, authorize(UserRole.ADMIN), adminController.get);
 * ```
 */
export declare const authorize: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
/**
 * Optional authentication middleware
 * Attempts to authenticate user but doesn't fail if token is missing or invalid
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map