import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';
import config from '../config';
import { User } from '../models';
import { AppError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    subscriptionTier: string;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('No token provided', 401));
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    const user = await User.findById(decoded.userId).select('email role subscriptionTier isVerified');

    if (!user) {
      return next(new AppError('User not found', 401));
    }

    if (!user.isVerified) {
      return next(new AppError('Please verify your email address', 401));
    }

    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier
      };
    }
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    const user = await User.findById(decoded.userId).select('email role subscriptionTier isVerified');

    if (user && user.isVerified) {
      if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier
      };
    }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
};