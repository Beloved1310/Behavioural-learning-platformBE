/**
 * Unit Tests for PreferencesService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import preferencesService from '../../../services/preferencesService';
import userPreferencesRepository from '../../../repositories/UserPreferencesRepository';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/UserPreferencesRepository');

describe('PreferencesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPreferences', () => {
    it('should return existing preferences when they exist', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      };

      (userPreferencesRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue(
        mockPreferences
      );

      // Act
      const result = await preferencesService.getPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.studyReminders).toBe(true);
      expect(result.language).toBe('en');
      expect(userPreferencesRepository.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should create default preferences when none exist', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      };

      (userPreferencesRepository.findByUserId as jest.MockedFunction<any>)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockPreferences);
      (userPreferencesRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        mockPreferences
      );

      // Act
      const result = await preferencesService.getPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.studyReminders).toBe(true);
      expect(userPreferencesRepository.create).toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should update existing preferences', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const existingPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        language: 'en',
      };
      const updatedPreferences = {
        ...existingPreferences,
        studyReminders: false,
        language: 'es',
      };

      (userPreferencesRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue(
        existingPreferences
      );
      (userPreferencesRepository.updateByUserId as jest.MockedFunction<any>).mockResolvedValue(
        updatedPreferences
      );

      // Act
      const result = await preferencesService.updatePreferences(userId, {
        studyReminders: false,
        language: 'es',
      });

      // Assert
      expect(result.studyReminders).toBe(false);
      expect(result.language).toBe('es');
      expect(userPreferencesRepository.updateByUserId).toHaveBeenCalled();
    });

    it('should create preferences when updating non-existent preferences', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const newPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: false,
        language: 'es',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      };

      (userPreferencesRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue(null);
      (userPreferencesRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        newPreferences
      );

      // Act
      const result = await preferencesService.updatePreferences(userId, {
        studyReminders: false,
        language: 'es',
      });

      // Assert
      expect(result).toBeDefined();
      expect(userPreferencesRepository.create).toHaveBeenCalled();
    });

    it('should throw error when update fails', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const existingPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
      };

      (userPreferencesRepository.findByUserId as jest.MockedFunction<any>).mockResolvedValue(
        existingPreferences
      );
      (userPreferencesRepository.updateByUserId as jest.MockedFunction<any>).mockResolvedValue(
        null
      );

      // Act & Assert
      await expect(
        preferencesService.updatePreferences(userId, { studyReminders: false })
      ).rejects.toThrow('Failed to update preferences');
    });
  });

  describe('resetPreferences', () => {
    it('should reset existing preferences to defaults', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const resetPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      };

      (userPreferencesRepository.updateByUserId as jest.MockedFunction<any>).mockResolvedValue(
        resetPreferences
      );

      // Act
      const result = await preferencesService.resetPreferences(userId);

      // Assert
      expect(result.studyReminders).toBe(true);
      expect(result.language).toBe('en');
      expect(result.darkMode).toBe(false);
      expect(userPreferencesRepository.updateByUserId).toHaveBeenCalled();
    });

    it('should create preferences when resetting non-existent preferences', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const defaultPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        studyReminders: true,
        darkMode: false,
        language: 'en',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
      };

      (userPreferencesRepository.updateByUserId as jest.MockedFunction<any>).mockResolvedValue(
        null
      );
      (userPreferencesRepository.create as jest.MockedFunction<any>).mockResolvedValue(
        defaultPreferences
      );

      // Act
      const result = await preferencesService.resetPreferences(userId);

      // Assert
      expect(result).toBeDefined();
      expect(userPreferencesRepository.create).toHaveBeenCalled();
    });
  });
});
