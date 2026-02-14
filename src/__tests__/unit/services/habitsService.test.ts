/**
 * Unit Tests for HabitsService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import habitsService from '../../../services/habitsService';
import customEventRepository from '../../../repositories/CustomEventRepository';
import userRepository from '../../../repositories/UserRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/CustomEventRepository');
jest.mock('../../../repositories/UserRepository');

describe('HabitsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHeatmap', () => {
    it('should return heatmap data for the specified number of days', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const days = 7;
      const mockEvents = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'session_start',
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'session_start',
          timestamp: new Date('2024-01-15T14:00:00Z'),
        },
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'quiz_complete',
          timestamp: new Date('2024-01-16T09:00:00Z'),
        },
      ];

      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue(mockEvents);

      // Act
      const result = await habitsService.getHeatmap(userId, days);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(days);
      expect(customEventRepository.find).toHaveBeenCalled();
    });

    it('should use default 30 days when days parameter is not provided', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await habitsService.getHeatmap(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(30);
    });

    it('should categorize activity levels correctly', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const days = 7;
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];

      // Create 5 events for today (should be level 3)
      const mockEvents = Array.from({ length: 5 }, (_, i) => ({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        eventType: 'session_start',
        timestamp: new Date(today.getTime() + i * 1000),
      }));

      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue(mockEvents);

      // Act
      const result = await habitsService.getHeatmap(userId, days);

      // Assert
      const todayData = result.find((r) => r.date === dateKey);
      expect(todayData).toBeDefined();
      expect(todayData?.activity).toBe(3);
      expect(todayData?.count).toBe(5);
    });

    it('should handle empty events array', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await habitsService.getHeatmap(userId, 7);

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(7);
      expect(result.every((r) => r.activity === 0)).toBe(true);
    });

    it('should categorize activity level 2 correctly (3-4 events)', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const days = 7;
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];

      // Create 3 events for today (should be level 2)
      const mockEvents = Array.from({ length: 3 }, (_, i) => ({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        eventType: 'session_start',
        timestamp: new Date(today.getTime() + i * 1000),
      }));

      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue(mockEvents);

      // Act
      const result = await habitsService.getHeatmap(userId, days);

      // Assert
      const todayData = result.find((r) => r.date === dateKey);
      expect(todayData).toBeDefined();
      expect(todayData?.activity).toBe(2);
    });

    it('should categorize activity level 1 correctly (1-2 events)', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const days = 7;
      const today = new Date();
      const dateKey = today.toISOString().split('T')[0];

      // Create 1 event for today (should be level 1)
      const mockEvents = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'session_start',
          timestamp: today,
        },
      ];

      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue(mockEvents);

      // Act
      const result = await habitsService.getHeatmap(userId, days);

      // Assert
      const todayData = result.find((r) => r.date === dateKey);
      expect(todayData).toBeDefined();
      expect(todayData?.activity).toBe(1);
    });
  });

  describe('getStreaks', () => {
    it('should return streaks for login, study, and quiz', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 5,
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await habitsService.getStreaks(userId);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0].type).toBe('login');
      expect(result[0].days).toBe(5);
      expect(result[1].type).toBe('study');
      expect(result[2].type).toBe('quiz');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(habitsService.getStreaks(userId)).rejects.toThrow(AppError);
      await expect(habitsService.getStreaks(userId)).rejects.toThrow('User not found');
    });

    it('should handle user with no streakCount', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await habitsService.getStreaks(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result[0].days).toBe(0);
    });

    it('should calculate study streak correctly', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 0,
      };
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockEvents = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'session_start',
          timestamp: today,
        },
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          eventType: 'session_start',
          timestamp: yesterday,
        },
      ];

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (customEventRepository.find as jest.MockedFunction<any>)
        .mockResolvedValueOnce(mockEvents) // For study streak
        .mockResolvedValueOnce([]); // For quiz streak

      // Act
      const result = await habitsService.getStreaks(userId);

      // Assert
      expect(result[1].days).toBeGreaterThan(0);
    });

    it('should return 0 streak when no events exist', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 0,
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (customEventRepository.find as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await habitsService.getStreaks(userId);

      // Assert
      expect(result[1].days).toBe(0);
      expect(result[2].days).toBe(0);
    });
  });
});
