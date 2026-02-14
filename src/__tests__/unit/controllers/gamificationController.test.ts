/**
 * Unit Tests for GamificationController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GamificationController } from '../../../controllers/gamificationController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import { GamificationService } from '../../../services/gamificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../services/gamificationService');
jest.mock('../../../socket', () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
  }),
  // @ts-expect-error - Mock type inference issue
  sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
}));

describe('GamificationController', () => {
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

  describe('createQuiz', () => {
    it('should create quiz successfully', async () => {
      // Arrange
      const mockQuiz = {
        id: new Types.ObjectId().toString(),
        title: 'Test Quiz',
      };

      // @ts-expect-error - Mock type inference issue
      (GamificationService.createQuiz as any) = jest.fn().mockResolvedValue(mockQuiz);
      mockRequest.body = {
        title: 'Test Quiz',
        subject: 'Math',
        questions: [],
      };

      // Act
      await GamificationController.createQuiz(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if user is not tutor or admin', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };

      // Act
      await GamificationController.createQuiz(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getQuizzes', () => {
    it('should return quizzes with pagination', async () => {
      // Arrange
      const mockQuizzes = [
        { id: new Types.ObjectId().toString(), title: 'Quiz 1' },
        { id: new Types.ObjectId().toString(), title: 'Quiz 2' },
      ];

      // @ts-expect-error - Mock type inference issue
      (GamificationService.getQuizzes as any) = jest.fn().mockResolvedValue({
        quizzes: mockQuizzes,
        total: 2,
      });

      // Act
      await GamificationController.getQuizzes(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('getQuizById', () => {
    it('should return quiz by ID', async () => {
      // Arrange
      const quizId = new Types.ObjectId().toString();
      const mockQuiz = {
        id: quizId,
        title: 'Test Quiz',
      };

      // @ts-expect-error - Mock type inference issue
      (GamificationService.getQuizById as any) = jest.fn().mockResolvedValue(mockQuiz);
      mockRequest.params = { id: quizId };

      // Act
      await GamificationController.getQuizById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('submitQuizAttempt', () => {
    it('should submit quiz attempt successfully', async () => {
      // Arrange
      const mockResult = {
        attempt: {
          _id: new Types.ObjectId(),
          quizId: new Types.ObjectId(),
          score: 85,
          totalPoints: 100,
          percentage: 85,
          completedAt: new Date(),
          timeSpent: 300,
        },
        newBadges: [],
        pointsEarned: 100,
      };

      // @ts-expect-error - Mock type inference issue
      (GamificationService.submitQuizAttempt as any) = jest.fn().mockResolvedValue(mockResult);
      mockRequest.body = {
        quizId: new Types.ObjectId().toString(),
        answers: {},
        timeSpent: 300,
      };

      // Act
      await GamificationController.submitQuizAttempt(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
