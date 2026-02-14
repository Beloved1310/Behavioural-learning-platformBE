/**
 * Unit Tests for GoalsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { GoalsController } from '../../../controllers/goalsController';
import goalRepository from '../../../repositories/GoalRepository';
import quizAttemptRepository from '../../../repositories/QuizAttemptRepository';
import sessionRepository from '../../../repositories/SessionRepository';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../repositories/GoalRepository');
jest.mock('../../../repositories/QuizAttemptRepository');
jest.mock('../../../repositories/SessionRepository');

describe('GoalsController', () => {
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
      query: {},
      params: {},
    } as any;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();

    // Ensure repository methods are mocked (Jest auto-mock doesn't create all methods)
    if (!goalRepository.findByUser) (goalRepository as any).findByUser = jest.fn();
    if (!goalRepository.findById) (goalRepository as any).findById = jest.fn();
    if (!goalRepository.create) (goalRepository as any).create = jest.fn();
    if (!goalRepository.updateProgress) (goalRepository as any).updateProgress = jest.fn();
    if (!goalRepository.deleteById) (goalRepository as any).deleteById = jest.fn();
    if (!quizAttemptRepository.find) (quizAttemptRepository as any).find = jest.fn();
    if (!sessionRepository.find) (sessionRepository as any).find = jest.fn();
  });

  describe('getGoals', () => {
    it('should return paginated goals', async () => {
      // Arrange
      const mockGoals = [
        {
          _id: new Types.ObjectId(),
          title: 'Goal 1',
          target: 100,
          current: 50,
          userId: {
            toString: () => '507f1f77bcf86cd799439011',
          },
        },
      ];

      (goalRepository as any).findByUser = jest.fn();
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue(mockGoals as any);

      // Act
      await GoalsController.getGoals(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(goalRepository.findByUser).toHaveBeenCalledWith('507f1f77bcf86cd799439011', true);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          goals: expect.any(Array),
          pagination: expect.any(Object),
        })
      );
    });
  });

  describe('createGoal', () => {
    it('should create goal successfully', async () => {
      // Arrange
      mockRequest.body = {
        title: 'New Goal',
        description: 'Goal description',
        target: 100,
        deadline: '2024-12-31',
      };

      const mockGoal = {
        _id: new Types.ObjectId(),
        title: 'New Goal',
        target: 100,
        current: 0,
      };

      (goalRepository as any).create = jest.fn();
      (goalRepository.create as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);

      // Act
      await GoalsController.createGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(goalRepository.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          goal: expect.any(Object),
        })
      );
    });

    it('should throw error when title is missing', async () => {
      // Arrange
      mockRequest.body = {
        target: 100,
      };

      // Act
      await GoalsController.createGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Title and target are required');
      expect(error.statusCode).toBe(400);
    });

    it('should throw error when target is missing', async () => {
      // Arrange
      mockRequest.body = {
        title: 'New Goal',
      };

      // Act
      await GoalsController.createGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      const mockGoal = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      };

      const updatedGoal = {
        ...mockGoal,
        current: 3,
        achievedMilestones: [],
      };

      // Set up mocks - ensure methods are jest functions
      (goalRepository as any).findById = jest.fn();
      (quizAttemptRepository as any).find = jest.fn();
      (sessionRepository as any).find = jest.fn();
      (goalRepository as any).updateProgress = jest.fn();

      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);
      (quizAttemptRepository.find as jest.MockedFunction<any>).mockResolvedValue([
        { _id: 1 },
        { _id: 2 },
      ] as any);
      (sessionRepository.find as jest.MockedFunction<any>).mockResolvedValue([{ _id: 1 }] as any);
      (goalRepository.updateProgress as jest.MockedFunction<any>).mockResolvedValue(
        updatedGoal as any
      );

      // Act
      GoalsController.updateProgress(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      // Check if error was thrown
      if (mockNext.mock.calls.length > 0) {
        const error = mockNext.mock.calls[0][0] as any;
        throw error; // Re-throw to see the actual error
      }

      expect(goalRepository.findById).toHaveBeenCalledWith('goal123');
      expect(quizAttemptRepository.find).toHaveBeenCalled();
      expect(sessionRepository.find).toHaveBeenCalled();
      expect(goalRepository.updateProgress).toHaveBeenCalledWith('goal123', 3);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          goal: expect.any(Object),
        })
      );
    });

    it('should throw error when goal not found', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      GoalsController.updateProgress(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Goal not found');
      expect(error.statusCode).toBe(404);
    });

    it('should throw error when access denied', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      const mockGoal = {
        _id: new Types.ObjectId(),
        userId: {
          toString: () => '507f1f77bcf86cd799439012',
        },
      };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);

      // Act
      GoalsController.updateProgress(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0] as AppError;
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('getMilestones', () => {
    it('should return milestones for goal', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      const mockGoal = {
        _id: new Types.ObjectId(),
        current: 30,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [25],
      };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);

      // Act
      await GoalsController.getMilestones(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          milestones: expect.objectContaining({
            current: 30,
            target: 100,
            progressPercent: expect.any(Number),
            upcoming: expect.any(Array),
            achieved: expect.any(Array),
          }),
        })
      );
    });

    it('should throw error when goal not found', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      GoalsController.getMilestones(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('deleteGoal', () => {
    it('should delete goal successfully', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      const mockGoal = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId('507f1f77bcf86cd799439011'),
      };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);
      (goalRepository as any).deleteById = jest.fn();
      (goalRepository.deleteById as jest.MockedFunction<any>).mockResolvedValue(undefined);

      // Act
      GoalsController.deleteGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(goalRepository.deleteById).toHaveBeenCalledWith('goal123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Goal deleted successfully',
      });
    });

    it('should throw error when goal not found', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act
      GoalsController.deleteGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should throw error when access denied', async () => {
      // Arrange
      mockRequest.params = { goalId: 'goal123' };

      const mockGoal = {
        _id: new Types.ObjectId(),
        userId: {
          toString: () => '507f1f77bcf86cd799439012',
        },
      };

      (goalRepository as any).findById = jest.fn();
      (goalRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockGoal as any);

      // Act
      GoalsController.deleteGoal(mockRequest as any, mockResponse as Response, mockNext);

      // Wait for async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });
});
