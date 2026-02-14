/**
 * Unit Tests for UserPreferencesRepository
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';
import { userPreferencesRepository } from '../../../repositories/UserPreferencesRepository';
import { UserPreferences } from '../../../models/UserPreferences';

// Mock the UserPreferences model
jest.mock('../../../models/UserPreferences');

describe('UserPreferencesRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should find preferences by user ID', async () => {
      const userId = new Types.ObjectId().toString();
      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        darkMode: false,
        emailNotifications: true,
      };

      (UserPreferences.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockPreferences
      );

      const result = await userPreferencesRepository.findByUserId(userId);

      expect(UserPreferences.findOne).toHaveBeenCalledWith({ userId }, null, undefined);
      expect(result).toEqual(mockPreferences);
    });

    it('should return null when preferences not found', async () => {
      const userId = new Types.ObjectId().toString();

      (UserPreferences.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await userPreferencesRepository.findByUserId(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateByUserId', () => {
    it('should update preferences by user ID', async () => {
      const userId = new Types.ObjectId().toString();
      const updates = { darkMode: true, emailNotifications: false };
      const mockUpdatedPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        ...updates,
      };

      (UserPreferences.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockUpdatedPreferences
      );

      const result = await userPreferencesRepository.updateByUserId(userId, updates);

      expect(UserPreferences.findOneAndUpdate).toHaveBeenCalledWith({ userId }, updates, {
        new: true,
        runValidators: true,
      });
      expect(result).toEqual(mockUpdatedPreferences);
    });

    it('should return null when user preferences not found', async () => {
      const userId = new Types.ObjectId().toString();

      (UserPreferences.findOneAndUpdate as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await userPreferencesRepository.updateByUserId(userId, { darkMode: true });

      expect(result).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('should delete preferences by user ID', async () => {
      const userId = new Types.ObjectId().toString();
      const mockDeletedPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
      };

      (UserPreferences.findOneAndDelete as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockDeletedPreferences
      );

      const result = await userPreferencesRepository.deleteByUserId(userId);

      expect(UserPreferences.findOneAndDelete).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockDeletedPreferences);
    });

    it('should return null when preferences not found', async () => {
      const userId = new Types.ObjectId().toString();

      (UserPreferences.findOneAndDelete as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await userPreferencesRepository.deleteByUserId(userId);

      expect(result).toBeNull();
    });
  });
});
