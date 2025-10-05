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
export declare const authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (...roles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const optionalAuth: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map