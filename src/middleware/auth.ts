import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';
import config from '../config';
import { User } from '../models';
import { AppError } from '../shared/errors/AppError';
import { logger } from '../utils/logger';

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
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('No token provided', 'NO_TOKEN'));
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.secret as string);
    } catch (jwtError) {
      logger.debug('JWT verification failed', { error: jwtError });
      return next(AppError.unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
    }

    const user = await User.findById(decoded.userId).select(
      'email role subscriptionTier isVerified'
    );

    if (!user) {
      logger.warn('User not found during authentication', { userId: decoded.userId });
      return next(AppError.unauthorized('User not found', 'USER_NOT_FOUND'));
    }

    if (!user.isVerified) {
      return next(AppError.unauthorized('Please verify your email address', 'EMAIL_NOT_VERIFIED'));
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    };

    next();
  } catch (error) {
    logger.error('Authentication error', error);
    next(AppError.unauthorized('Authentication failed', 'AUTH_ERROR'));
  }
};

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
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Authorization failed', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        path: req.path,
      });
      return next(AppError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attempts to authenticate user but doesn't fail if token is missing or invalid
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret as string) as any;

    const user = await User.findById(decoded.userId).select(
      'email role subscriptionTier isVerified'
    );

    if (user && user.isVerified) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
      };
    }
  } catch (error) {
    // Silently ignore authentication errors for optional auth
    // This allows the request to proceed without authentication
  }

  next();
};
