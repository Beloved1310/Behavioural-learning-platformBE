/**
 * Unit Tests for UserService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { UserService } from '../../../services/userService';
import { userRepository } from '../../../repositories/UserRepository';
import { userPreferencesRepository } from '../../../repositories/UserPreferencesRepository';
import { Types } from 'mongoose';

jest.mock('../../../repositories/UserRepository');
jest.mock('../../../repositories/UserPreferencesRepository');
jest.mock('../../../utils/cloudinary', () => ({
  uploadToCloudinary: jest.fn(),
  deleteFromCloudinary: jest.fn(),
  extractPublicId: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile with preferences', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        darkMode: false,
        language: 'en',
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockUser);
      // @ts-expect-error - Mock type inference issue
      (userPreferencesRepository.findByUserId as any) = jest.fn().mockResolvedValue(mockPreferences);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findByIdWithFields as any) = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getProfile(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.preferences).toBeDefined();
    });

    it('should create preferences if not found', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockUser);
      // @ts-expect-error - Mock type inference issue
      (userPreferencesRepository.findByUserId as any) = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock type inference issue
      (userPreferencesRepository.create as any) = jest.fn().mockResolvedValue(mockPreferences);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findByIdWithFields as any) = jest.fn().mockResolvedValue(mockUser);

      // Act
      const result = await UserService.getProfile(userId);

      // Assert
      expect(result).toBeDefined();
      expect(userPreferencesRepository.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(UserService.getProfile(userId)).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockUser = {
        _id: new Types.ObjectId(userId),
        firstName: 'John',
        lastName: 'Doe',
        role: 'STUDENT',
        // @ts-expect-error - Mock type inference issue
        save: jest.fn().mockResolvedValue(true),
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockUser);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findByIdWithFields as any) = jest.fn().mockResolvedValue({
        ...mockUser,
        firstName: 'Jane',
        lastName: 'Smith',
      });

      const payload = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      // Act
      const result = await UserService.updateProfile(userId, payload);

      // Assert
      expect(result).toBeDefined();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
});
