/**
 * Unit Tests for Authentication Middleware
 *
 * Coverage Goals: 80%+ for middleware
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize, AuthenticatedRequest } from '../../../middleware/auth';
import { User } from '../../../models/User';
import { AppError } from '../../../shared/errors/AppError';
import { UserRole } from '../../../types';
import config from '../../../config';
import { createMockUser } from '../../helpers/testData';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../models/User');
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const token = 'valid-token';
      const decoded = { userId };
      const mockUser = createMockUser({
        _id: userId,
        isVerified: true,
        role: UserRole.STUDENT,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.MockedFunction<any>).mockReturnValue(decoded);
      (User.findById as jest.MockedFunction<any>).mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(mockUser) as jest.Mock,
      } as any);

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, config.jwt.secret);
      expect(User.findById).toHaveBeenCalledWith(userId);
      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.id).toBe(userId);
      expect(mockRequest.user?.email).toBe(mockUser.email);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No token provided',
        })
      );
    });

    it('should return 401 when token format is invalid', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'No token provided',
        })
      );
    });

    it('should return 401 when token is invalid or expired', async () => {
      // Arrange
      const token = 'invalid-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.MockedFunction<any>).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Invalid or expired token',
        })
      );
    });

    it('should return 401 when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const token = 'valid-token';
      const decoded = { userId };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.MockedFunction<any>).mockReturnValue(decoded);
      (User.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      // The middleware catches errors and wraps them in a generic error
      expect(mockNext).toHaveBeenCalled();
      const errorArg = (mockNext as jest.MockedFunction<any>).mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(AppError);
      expect(errorArg.statusCode).toBe(401);
    });

    it('should return 401 when email is not verified', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const token = 'valid-token';
      const decoded = { userId };
      const mockUser = createMockUser({
        _id: userId,
        isVerified: false,
      });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwt.verify as jest.MockedFunction<any>).mockReturnValue(decoded);
      (User.findById as jest.MockedFunction<any>).mockReturnValue({
        select: (jest.fn() as any).mockResolvedValue(mockUser) as jest.Mock,
      } as any);

      // Act
      await authenticate(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      // The middleware catches errors and wraps them in a generic error
      expect(mockNext).toHaveBeenCalled();
      const errorArg = (mockNext as jest.MockedFunction<any>).mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(AppError);
      expect(errorArg.statusCode).toBe(401);
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      // Arrange
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        subscriptionTier: 'PREMIUM',
      };

      const authorizeMiddleware = authorize(UserRole.ADMIN);

      // Act
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      // Arrange
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'student@example.com',
        role: UserRole.STUDENT,
        subscriptionTier: 'BASIC',
      };

      const authorizeMiddleware = authorize(UserRole.ADMIN);

      // Act
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'Insufficient permissions',
        })
      );
    });

    it('should allow access when user has one of multiple required roles', () => {
      // Arrange
      mockRequest.user = {
        id: '507f1f77bcf86cd799439011',
        email: 'tutor@example.com',
        role: UserRole.TUTOR,
        subscriptionTier: 'BASIC',
      };

      const authorizeMiddleware = authorize(UserRole.TUTOR, UserRole.ADMIN);

      // Act
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      const authorizeMiddleware = authorize(UserRole.ADMIN);

      // Act
      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          message: 'Authentication required',
        })
      );
    });
  });
});
