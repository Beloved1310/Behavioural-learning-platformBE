/**
 * Unit Tests for PreferencesController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { PreferencesController } from '../../../controllers/preferencesController';
import preferencesService from '../../../services/preferencesService';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../services/preferencesService');

describe('PreferencesController', () => {
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

  describe('getPreferences', () => {
    it('should return user preferences', async () => {
      // Arrange
      const mockPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (preferencesService.getPreferences as jest.MockedFunction<any>).mockResolvedValue(
        mockPreferences
      );

      // Act
      await PreferencesController.getPreferences(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(preferencesService.getPreferences).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        preferences: expect.objectContaining({
          studyReminders: true,
          language: 'en',
        }),
      });
    });
  });

  describe('updatePreferences', () => {
    it('should update user preferences', async () => {
      // Arrange
      const updateData = {
        studyReminders: false,
        language: 'es',
      };

      mockRequest.body = updateData;

      const updatedPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        studyReminders: false,
        language: 'es',
        timezone: 'UTC',
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        sessionReminders: true,
        progressReports: true,
        weeklyReport: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (preferencesService.updatePreferences as jest.MockedFunction<any>).mockResolvedValue(
        updatedPreferences
      );

      // Act
      await PreferencesController.updatePreferences(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(preferencesService.updatePreferences).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateData
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Preferences updated successfully',
        preferences: expect.objectContaining({
          studyReminders: false,
          language: 'es',
        }),
      });
    });
  });

  describe('resetPreferences', () => {
    it('should reset preferences to default', async () => {
      // Arrange
      const resetPreferences = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (preferencesService.resetPreferences as jest.MockedFunction<any>).mockResolvedValue(
        resetPreferences
      );

      // Act
      await PreferencesController.resetPreferences(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(preferencesService.resetPreferences).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Preferences reset to default',
        preferences: expect.objectContaining({
          studyReminders: true,
          language: 'en',
        }),
      });
    });
  });
});
