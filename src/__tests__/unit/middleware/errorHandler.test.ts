/**
 * Unit Tests for ErrorHandler Middleware
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { errorHandler, AppError } from '../../../middleware/errorHandler';
import { logger } from '../../../utils/logger';

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('errorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: 'GET',
      url: '/test',
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1',
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('AppError handling', () => {
    it('should handle AppError with status code and message', () => {
      // Arrange
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Test error',
        code: 'TEST_ERROR',
      });
    });

    it('should handle AppError with details', () => {
      // Arrange
      const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR', {
        field: 'email',
        message: 'Invalid email format',
      });

      // Act
      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: {
          field: 'email',
          message: 'Invalid email format',
        },
      });
    });
  });

  describe('Mongoose validation errors', () => {
    it('should handle Mongoose ValidationError', () => {
      // Arrange
      const validationError = new mongoose.Error.ValidationError();
      validationError.errors = {
        email: new mongoose.Error.ValidatorError({
          message: 'Email is required',
          path: 'email',
          value: undefined,
        } as any),
      };

      // Act
      errorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        details: [
          {
            field: 'email',
            message: 'Email is required',
          },
        ],
      });
    });
  });

  describe('JWT errors', () => {
    it('should handle JsonWebTokenError', () => {
      // Arrange
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';

      // Act
      errorHandler(jwtError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    });

    it('should handle TokenExpiredError', () => {
      // Arrange
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';

      // Act
      errorHandler(expiredError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    });
  });

  describe('MongoDB errors', () => {
    it('should handle duplicate key error', () => {
      // Arrange
      const duplicateError: any = new Error('Duplicate entry');
      duplicateError.code = 11000;
      duplicateError.keyPattern = { email: 1 };

      // Act
      errorHandler(duplicateError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Duplicate entry',
        code: 'DUPLICATE_ENTRY',
        details: {
          field: 'email',
          message: 'email already exists',
        },
      });
    });

    it('should handle CastError (invalid ObjectId)', () => {
      // Arrange
      const castError = new mongoose.Error.CastError('ObjectId', 'invalid-id', '_id');

      // Act
      errorHandler(castError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid ID format',
        code: 'INVALID_ID',
      });
    });
  });

  describe('Generic errors', () => {
    it('should handle generic errors with 500 status', () => {
      // Arrange
      const genericError = new Error('Something went wrong');

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong', // Error handler uses error.message if available
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log error details in development', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const genericError = new Error('Test error');
      genericError.stack = 'Error stack trace';

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(logger.error).toHaveBeenCalled();

      // Restore
      process.env.NODE_ENV = originalEnv;
    });
  });
});
