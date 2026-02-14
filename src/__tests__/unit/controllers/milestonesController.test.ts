/**
 * Unit Tests for MilestonesController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { MilestonesController } from '../../../controllers/milestonesController';
import milestoneService from '../../../services/milestoneService';

// Mock dependencies
jest.mock('../../../services/milestoneService');

describe('MilestonesController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
      },
    } as any;

    mockResponse = {
      json: jest.fn(),
    } as any;

    mockNext = jest.fn();
  });

  describe('getUpcoming', () => {
    it('should return upcoming milestones', async () => {
      // Arrange
      const mockUpcoming = [
        { id: 'milestone1', name: 'First Quiz', target: 1, current: 0 },
        { id: 'milestone2', name: '10 Sessions', target: 10, current: 5 },
      ];

      (milestoneService.getUpcoming as jest.MockedFunction<any>).mockResolvedValue(mockUpcoming);

      // Act
      await MilestonesController.getUpcoming(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(milestoneService.getUpcoming).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        upcoming: mockUpcoming,
      });
    });

    it('should return empty array when no upcoming milestones', async () => {
      // Arrange
      (milestoneService.getUpcoming as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      await MilestonesController.getUpcoming(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(milestoneService.getUpcoming).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        upcoming: [],
      });
    });
  });

  describe('checkMilestones', () => {
    it('should check and award milestones', async () => {
      // Arrange
      const mockResult = {
        awarded: [{ id: 'milestone1', name: 'First Quiz', awardedAt: new Date() }],
        checked: 5,
      };

      (milestoneService.checkMilestones as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await MilestonesController.checkMilestones(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(milestoneService.checkMilestones).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });

    it('should return empty awarded array when no milestones achieved', async () => {
      // Arrange
      const mockResult = {
        awarded: [],
        checked: 5,
      };

      (milestoneService.checkMilestones as jest.MockedFunction<any>).mockResolvedValue(mockResult);

      // Act
      await MilestonesController.checkMilestones(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(milestoneService.checkMilestones).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        ...mockResult,
      });
    });
  });
});
