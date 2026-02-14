/**
 * Unit Tests for TutorCommitmentsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorCommitmentsController } from '../../../controllers/tutorCommitmentsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import weeklyCommitmentRepository from '../../../repositories/WeeklyCommitmentRepository';
import userRepository from '../../../repositories/UserRepository';
import notificationService from '../../../services/notificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/WeeklyCommitmentRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/notificationService');
jest.mock('../../../models/WeeklyCommitment', () => ({
  WeeklyCommitment: {
    findOne: jest.fn(),
  },
}));

describe('TutorCommitmentsController', () => {
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

  describe('assignCommitment', () => {
    it('should assign commitment to student successfully', async () => {
      // Arrange
      const studentId = new Types.ObjectId().toString();
      const tutorId = mockUser.id;
      mockRequest.params = { studentId };
      mockRequest.body = {
        commitments: [
          { text: 'Study Math for 1 hour', type: 'time', target: 60 },
        ],
        weekStart: new Date().toISOString(),
      };

      const mockStudent = {
        _id: new Types.ObjectId(studentId),
        role: UserRole.STUDENT,
      };

      const mockTutor = {
        _id: new Types.ObjectId(tutorId),
        firstName: 'Tutor',
        lastName: 'Name',
      };

      const { WeeklyCommitment } = await import('../../../models/WeeklyCommitment');
      // @ts-expect-error - Mock type inference issue
      (WeeklyCommitment.findOne as any) = jest.fn().mockResolvedValue(null);
      (userRepository.findById as any) = jest.fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce(mockStudent)
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce(mockTutor);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.create as any) = jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(studentId),
      });
      // @ts-expect-error - Mock type inference issue
      (notificationService.notifyCommitmentAssigned as any) = jest.fn().mockResolvedValue(undefined);

      // Act
      TutorCommitmentsController.assignCommitment(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };
      mockRequest.params = { studentId: new Types.ObjectId().toString() };
      mockRequest.body = { commitments: [] };

      // Act
      await TutorCommitmentsController.assignCommitment(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if commitments array is empty', async () => {
      // Arrange
      mockRequest.params = { studentId: new Types.ObjectId().toString() };
      mockRequest.body = { commitments: [] };

      // Act
      await TutorCommitmentsController.assignCommitment(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw error if student not found', async () => {
      // Arrange
      mockRequest.params = { studentId: new Types.ObjectId().toString() };
      mockRequest.body = {
        commitments: [{ text: 'Study', type: 'time', target: 60 }],
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(null);

      // Act
      await TutorCommitmentsController.assignCommitment(
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

