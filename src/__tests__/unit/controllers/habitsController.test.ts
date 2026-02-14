/**
 * Unit Tests for HabitsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { HabitsController } from '../../../controllers/habitsController';
import habitsService from '../../../services/habitsService';

// Mock dependencies
jest.mock('../../../services/habitsService');

describe('HabitsController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
      },
      query: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getHeatmap', () => {
    it('should return heatmap data with default days', async () => {
      // Arrange
      const mockHeatmap = {
        '2024-01-01': { count: 3, completed: true },
        '2024-01-02': { count: 2, completed: true },
        '2024-01-03': { count: 0, completed: false },
      };

      (habitsService.getHeatmap as jest.MockedFunction<any>).mockResolvedValue(mockHeatmap);

      // Act
      await HabitsController.getHeatmap(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(habitsService.getHeatmap).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 30);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        heatmap: mockHeatmap,
      });
    });

    it('should return heatmap data with custom days', async () => {
      // Arrange
      mockRequest.query = { days: '60' };

      const mockHeatmap = {
        '2024-01-01': { count: 3, completed: true },
      };

      (habitsService.getHeatmap as jest.MockedFunction<any>).mockResolvedValue(mockHeatmap);

      // Act
      await HabitsController.getHeatmap(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(habitsService.getHeatmap).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 60);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        heatmap: mockHeatmap,
      });
    });
  });

  describe('getStreaks', () => {
    it('should return active streaks', async () => {
      // Arrange
      const mockStreaks = [
        { habitId: 'habit1', name: 'Daily Study', currentStreak: 7, longestStreak: 30 },
        { habitId: 'habit2', name: 'Exercise', currentStreak: 3, longestStreak: 15 },
      ];

      (habitsService.getStreaks as jest.MockedFunction<any>).mockResolvedValue(mockStreaks);

      // Act
      await HabitsController.getStreaks(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(habitsService.getStreaks).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        streaks: mockStreaks,
      });
    });

    it('should return empty array when no streaks exist', async () => {
      // Arrange
      (habitsService.getStreaks as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      await HabitsController.getStreaks(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(habitsService.getStreaks).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        streaks: [],
      });
    });
  });
});
