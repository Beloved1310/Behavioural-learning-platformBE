/**
 * Unit Tests for AuthController
 *
 * Section 5.3.2: Unit Testing Implementation and Results
 *
 * Coverage Goals: 80%+ for controllers
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../../../controllers/authController';
import { AuthService } from '../../../services/authService';
import { AppError } from '../../../shared/errors/AppError';
import { createMockUser, validUserData } from '../../helpers/testData';

// Mock AuthService
jest.mock('../../../services/authService');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      cookies: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
      cookie: jest.fn().mockReturnThis() as any,
      clearCookie: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register user successfully and return 201', async () => {
      // Arrange
      mockRequest.body = validUserData;
      const mockResult = {
        user: createMockUser(),
        message: 'Registration successful. Please check your email to verify your account.',
      };

      (AuthService.register as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await AuthController.register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AuthService.register).toHaveBeenCalledWith(validUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Registration successful',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      // Arrange
      mockRequest.body = validUserData;
      const error = AppError.conflict('User already exists', 'EMAIL_EXISTS');

      (AuthService.register as jest.MockedFunction<any>).mockRejectedValue(error);

      // Act - asyncHandler wraps the controller and catches errors
      // The controller is already wrapped, so we call it directly
      AuthController.register(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert - asyncHandler should call next with the error
      // Wait for the promise to resolve/reject
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('should login user successfully and set refresh token cookie', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };
      const mockResult = {
        user: createMockUser(),
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      (AuthService.login as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AuthService.login).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: mockResult.user,
          accessToken: mockResult.tokens.accessToken,
        },
        message: 'Login successful',
      });
    });

    it('should handle login errors', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };
      const error = AppError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');

      (AuthService.login as jest.MockedFunction<any>).mockRejectedValue(error);

      // Act - asyncHandler wraps the controller and catches errors
      AuthController.login(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert - asyncHandler should call next with the error
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      mockRequest.cookies = { refreshToken: 'valid-refresh-token' };
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      (AuthService.refreshToken as jest.MockedFunction<any>).mockResolvedValue(mockTokens);

      // Act
      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh-token',
        expect.any(Object)
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          accessToken: 'new-access-token',
        },
      });
    });

    it('should return error when no refresh token provided', async () => {
      // Arrange
      mockRequest.cookies = {};

      // Act
      await AuthController.refreshToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No refresh token provided',
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear refresh token cookie', async () => {
      // Act
      await AuthController.logout(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully with valid token', async () => {
      // Arrange
      mockRequest.query = { token: 'valid-verification-token' };
      const mockResult = {
        message: 'Email verified successfully',
      };

      (AuthService.verifyEmail as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await AuthController.verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AuthService.verifyEmail).toHaveBeenCalledWith('valid-verification-token');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });

    it('should return error when token is missing', async () => {
      // Arrange
      mockRequest.query = {};

      // Act
      await AuthController.verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Verification token is required',
        })
      );
    });

    it('should handle string array token and convert to string', async () => {
      // Arrange
      mockRequest.query = { token: ['token1', 'token2'] };
      const mockResult = {
        message: 'Email verified successfully',
      };

      (AuthService.verifyEmail as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await AuthController.verifyEmail(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(AuthService.verifyEmail).toHaveBeenCalledWith('token1,token2');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com' };
      const mockResult = {
        message: 'Verification email sent successfully',
      };

      (AuthService.resendVerificationEmail as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      // Act
      await AuthController.resendVerificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(AuthService.resendVerificationEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: mockResult.message,
      });
    });

    it('should return error when email is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await AuthController.resendVerificationEmail(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email is required',
        })
      );
    });
  });
});
