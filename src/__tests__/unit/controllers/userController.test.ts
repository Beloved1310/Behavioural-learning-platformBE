/**
 * Unit Tests for UserController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { UserController } from '../../../controllers/userController';
import { UserService } from '../../../services/userService';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../services/userService');

describe('UserController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
      },
      body: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getProfile', () => {
    it('should return user profile with preferences', async () => {
      // Arrange
      const mockUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'STUDENT',
        profileImage: null,
        phoneNumber: null,
        dateOfBirth: null,
        gradeLevel: null,
        learningStyle: null,
        academicGoals: [],
        subjects: [],
        bio: null,
        qualifications: [],
        totalPoints: 100,
        streakCount: 5,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };

      const mockPreferences = {
        _id: new Types.ObjectId(),
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        weeklyReport: true,
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
      };

      (UserService.getProfile as jest.MockedFunction<any>).mockResolvedValue({
        user: mockUser,
        preferences: mockPreferences,
      });

      // Act
      await UserController.getProfile(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.getProfile).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: expect.objectContaining({
            id: mockUser._id.toString(),
            firstName: 'John',
            email: 'john@example.com',
          }),
          preferences: expect.objectContaining({
            emailNotifications: true,
            darkMode: false,
          }),
        },
      });
    });

    it('should handle user with profile image', async () => {
      // Arrange
      const mockUser = {
        _id: new Types.ObjectId(),
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'TUTOR',
        profileImage: 'https://example.com/image.jpg',
        totalPoints: 0,
        streakCount: 0,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPreferences = {
        emailNotifications: true,
        pushNotifications: true,
        sessionReminders: true,
        weeklyReport: false,
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
      };

      (UserService.getProfile as jest.MockedFunction<any>).mockResolvedValue({
        user: mockUser,
        preferences: mockPreferences,
      });

      // Act
      await UserController.getProfile(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              profileImage: 'https://example.com/image.jpg',
            }),
          }),
        })
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '1234567890',
      };

      mockRequest.body = updateData;

      const updatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        firstName: 'Updated',
        lastName: 'Name',
        email: 'john@example.com',
        role: 'STUDENT',
        phoneNumber: '1234567890',
        totalPoints: 100,
        streakCount: 5,
        subscriptionTier: 'FREE',
        subscriptionStatus: 'INACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (UserService.updateProfile as jest.MockedFunction<any>).mockResolvedValue(updatedUser);

      // Act
      await UserController.updateProfile(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: expect.objectContaining({
          firstName: 'Updated',
          lastName: 'Name',
        }),
      });
    });

    it('should handle student-specific fields', async () => {
      // Arrange
      const updateData = {
        gradeLevel: '10',
        learningStyle: 'visual',
        academicGoals: ['goal1', 'goal2'],
      };

      mockRequest.body = updateData;

      const updatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        role: 'STUDENT',
        gradeLevel: '10',
        learningStyle: 'visual',
        academicGoals: ['goal1', 'goal2'],
      };

      (UserService.updateProfile as jest.MockedFunction<any>).mockResolvedValue(updatedUser);

      // Act
      await UserController.updateProfile(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData
      );
    });

    it('should handle tutor-specific fields', async () => {
      // Arrange
      (mockRequest as any).user = { id: '507f1f77bcf86cd799439012' };
      const updateData = {
        subjects: ['Math', 'Science'],
        bio: 'Experienced tutor',
        qualifications: ['Degree', 'Certification'],
      };

      mockRequest.body = updateData;

      const updatedUser = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
        role: 'TUTOR',
        subjects: ['Math', 'Science'],
        bio: 'Experienced tutor',
        qualifications: ['Degree', 'Certification'],
      };

      (UserService.updateProfile as jest.MockedFunction<any>).mockResolvedValue(updatedUser);

      // Act
      await UserController.updateProfile(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.updateProfile).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439012',
        updateData
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // Arrange
      mockRequest.body = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      (UserService.updatePassword as jest.MockedFunction<any>).mockResolvedValue({
        message: 'Password updated successfully',
      });

      // Act
      await UserController.updatePassword(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.updatePassword).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'oldPassword123',
        'newPassword123'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password updated successfully',
      });
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', async () => {
      // Arrange
      mockRequest.body = {
        password: 'password123',
      };

      (UserService.deleteAccount as jest.MockedFunction<any>).mockResolvedValue({
        message: 'Account deleted successfully',
      });

      // Act
      await UserController.deleteAccount(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(UserService.deleteAccount).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'password123'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Account deleted successfully',
      });
    });
  });
});
