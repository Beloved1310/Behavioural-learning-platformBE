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
      const error: AppError = new Error('No token provided');
      error.statusCode = 401;
      return next(error);
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    
    const user = await User.findById(decoded.userId).select('email role subscriptionTier isVerified');

    if (!user) {
      const error: AppError = new Error('User not found');
      error.statusCode = 401;
      return next(error);
    }

    if (!user.isVerified) {
      const error: AppError = new Error('Please verify your email address');
      error.statusCode = 401;
      return next(error);
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
    const authError: AppError = new Error('Invalid token');
    authError.statusCode = 401;
    next(authError);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      const error: AppError = new Error('Authentication required');
      error.statusCode = 401;
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error: AppError = new Error('Insufficient permissions');
      error.statusCode = 403;
      return next(error);
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