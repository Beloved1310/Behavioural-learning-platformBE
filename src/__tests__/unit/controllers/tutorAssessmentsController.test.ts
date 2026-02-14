/**
 * Unit Tests for TutorAssessmentsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorAssessmentsController } from '../../../controllers/tutorAssessmentsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import weeklyAssessmentRepository from '../../../repositories/WeeklyAssessmentRepository';
import userRepository from '../../../repositories/UserRepository';
import notificationService from '../../../services/notificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/WeeklyAssessmentRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/notificationService');

describe('TutorAssessmentsController', () => {
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

  describe('getStudentAssessments', () => {
    it('should return student assessments', async () => {
      // Arrange
      const studentId = new Types.ObjectId().toString();
      const mockAssessment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(studentId),
        weekStart: new Date(),
        weekRating: 8,
        whatWentWell: 'Good progress',
        challenges: 'Some difficulties',
        nextWeekFocus: 'Continue studying',
        commitmentLevel: 'high',
        tutorFeedback: null,
        completedAt: new Date(),
        createdAt: new Date(),
      };

      // @ts-expect-error - Mock type inference issue
      (weeklyAssessmentRepository.findByUser as any) = jest.fn().mockResolvedValue([mockAssessment]);
      mockRequest.params = { studentId };

      // Act
      await TutorAssessmentsController.getStudentAssessments(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
      const callArgs = (mockResponse.json as jest.Mock).mock.calls[0][0] as any;
      expect(callArgs.success).toBe(true);
      expect(callArgs.assessments).toBeDefined();
    });
  });

  describe('getPendingFeedback', () => {
    it('should return assessments pending feedback', async () => {
      // Arrange
      const mockAssessment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(),
        weekStart: new Date(),
        weekRating: 7,
        completedAt: new Date(),
      };

      // @ts-expect-error - Mock type inference issue
      (weeklyAssessmentRepository.find as any) = jest.fn().mockResolvedValue([mockAssessment]);

      // Act
      await TutorAssessmentsController.getPendingFeedback(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('addFeedback', () => {
    it('should add feedback to assessment successfully', async () => {
      // Arrange
      const assessmentId = new Types.ObjectId().toString();
      const studentId = new Types.ObjectId().toString();
      const mockAssessment = {
        _id: new Types.ObjectId(assessmentId),
        userId: new Types.ObjectId(studentId),
        tutorFeedback: null,
        // @ts-expect-error - Mock type inference issue
        save: jest.fn().mockResolvedValue(true),
      };

      const mockTutor = {
        _id: new Types.ObjectId(mockUser.id),
        firstName: 'Tutor',
        lastName: 'Name',
      };

      // @ts-expect-error - Mock type inference issue
      (weeklyAssessmentRepository.findById as any) = jest.fn().mockResolvedValue(mockAssessment);
      // @ts-expect-error - Mock type inference issue
      (weeklyAssessmentRepository.addTutorFeedback as any) = jest.fn().mockResolvedValue({
        ...mockAssessment,
        tutorFeedback: {
          tutorId: new Types.ObjectId(mockUser.id),
          comment: 'Great work!',
          encouragementLevel: 'high',
          feedbackAt: new Date(),
          isRead: false,
        },
      });
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockTutor);
      // @ts-expect-error - Mock type inference issue
      (notificationService.notifyAssessmentFeedback as any) = jest.fn().mockResolvedValue(undefined);

      mockRequest.params = { assessmentId };
      mockRequest.body = { comment: 'Great work!', encouragementLevel: 'high' };

      // Act
      TutorAssessmentsController.addFeedback(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if comment is missing', async () => {
      // Arrange
      mockRequest.params = { assessmentId: new Types.ObjectId().toString() };
      mockRequest.body = {};

      // Act
      await TutorAssessmentsController.addFeedback(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

