/**
 * Unit Tests for TutorGoalsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorGoalsController } from '../../../controllers/tutorGoalsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import goalRepository from '../../../repositories/GoalRepository';
import userRepository from '../../../repositories/UserRepository';
import notificationService from '../../../services/notificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/GoalRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/notificationService');

describe('TutorGoalsController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.TUTOR,
    };

    mockRequest = {
      user: mockUser,
      params: {},
      query: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis() as any,
      json: jest.fn().mockReturnThis() as any,
    };

    mockNext = jest.fn();
  });

  describe('getAssignedGoals', () => {
    it('should return paginated goals assigned by tutor', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const goalId = new Types.ObjectId();
      const mockGoal = {
        _id: goalId,
        userId: studentId,
        title: 'Test Goal',
        description: 'Test Description',
        target: 100,
        current: 50,
        deadline: new Date(),
        milestones: [25, 50, 75, 100],
        achievedMilestones: [25],
        assignedAt: new Date(),
        createdAt: new Date(),
      };

      const mockStudent = {
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
      };

      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByTutor as any) = jest.fn().mockResolvedValue([mockGoal]);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockStudent);

      // Act
      TutorGoalsController.getAssignedGoals(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.goals).toBeDefined();
    });
  });

  describe('assignGoal', () => {
    it('should assign goal to student successfully', async () => {
      // Arrange
      const studentId = new Types.ObjectId();
      const goalId = new Types.ObjectId();
      mockRequest.params = { studentId: studentId.toString() };
      mockRequest.body = {
        title: 'New Goal',
        description: 'Goal Description',
        target: 100,
        deadline: new Date().toISOString(),
        milestones: [25, 50, 75, 100],
      };

      const mockStudent = {
        _id: studentId,
        role: UserRole.STUDENT,
      };

      const mockTutor = {
        _id: new Types.ObjectId(),
        firstName: 'Tutor',
        lastName: 'Name',
      };

      const mockGoal = {
        _id: goalId,
        userId: studentId,
        title: 'New Goal',
        target: 100,
        current: 0,
        status: 'active',
        isActive: true,
      };

      (userRepository.findById as any)
        .mockResolvedValueOnce(mockStudent)
        .mockResolvedValueOnce(mockTutor);
      // @ts-expect-error - Mock type inference issue
      (goalRepository.create as any) = jest.fn().mockResolvedValue(mockGoal);
      // @ts-expect-error - Mock type inference issue
      (notificationService.notifyGoalAssigned as any) = jest.fn().mockResolvedValue(undefined);

      // Act
      TutorGoalsController.assignGoal(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(goalRepository.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if title or target is missing', async () => {
      // Arrange
      mockRequest.params = { studentId: new Types.ObjectId().toString() };
      mockRequest.body = {
        description: 'Goal Description',
        // Missing title and target
      };

      // Act & Assert
      await TutorGoalsController.assignGoal(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      // Arrange
      mockRequest.params = { studentId: new Types.ObjectId().toString() };
      mockRequest.body = {
        title: 'New Goal',
        target: 100,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await TutorGoalsController.assignGoal(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if user is not a student', async () => {
      // Arrange
      const tutorId = new Types.ObjectId();
      mockRequest.params = { studentId: tutorId.toString() };
      mockRequest.body = {
        title: 'New Goal',
        target: 100,
      };

      const mockTutor = {
        _id: tutorId,
        role: UserRole.TUTOR,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as jest.Mock) = jest.fn().mockResolvedValue(mockTutor);

      // Act & Assert
      await TutorGoalsController.assignGoal(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

