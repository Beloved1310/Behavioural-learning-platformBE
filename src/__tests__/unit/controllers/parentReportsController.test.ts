/**
 * Unit Tests for ParentReportsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ParentReportsController } from '../../../controllers/parentReportsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import { User } from '../../../models/User';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';
import quizAttemptRepository from '../../../repositories/QuizAttemptRepository';
import userProgressRepository from '../../../repositories/UserProgressRepository';
import * as emailService from '../../../services/emailService';

jest.mock('../../../models/User');
jest.mock('../../../repositories/QuizAttemptRepository');
jest.mock('../../../repositories/UserProgressRepository');
jest.mock('../../../services/emailService');

describe('ParentReportsController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.PARENT,
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

  describe('sendProgressReport', () => {
    it('should send progress report for weekly period', async () => {
      // Arrange
      const parentId = new Types.ObjectId(mockUser.id);
      const childId = new Types.ObjectId();
      const mockParent = {
        _id: parentId,
        firstName: 'Parent',
        lastName: 'Name',
        email: 'parent@example.com',
      };

      const mockChild = {
        _id: childId,
        firstName: 'Child',
        lastName: 'Name',
        parentId: parentId,
      };

      const mockAttempt = {
        _id: new Types.ObjectId(),
        studentId: childId,
        percentage: 85,
        quizId: { subject: 'Math' },
        completedAt: new Date(),
      };

      const mockProgress = {
        studyTime: 120, // minutes
      };

      // @ts-expect-error - Mock type inference issue
      (User.findById as any) = jest.fn().mockResolvedValue(mockParent);
      // @ts-expect-error - Mock type inference issue
      (User.find as any) = jest.fn().mockResolvedValue([mockChild]);
      (quizAttemptRepository as any).model = {
        find: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          populate: jest.fn().mockResolvedValue([mockAttempt]),
        }),
      };
      // @ts-expect-error - Mock type inference issue
      (userProgressRepository.findByUser as any) = jest.fn().mockResolvedValue(mockProgress);
      // @ts-expect-error - Mock type inference issue
      (emailService.sendParentProgressReportEmail as any) = jest.fn().mockResolvedValue(undefined);

      mockRequest.body = { period: 'weekly' };

      // Act
      ParentReportsController.sendProgressReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if user is not a parent', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };

      // Act
      await ParentReportsController.sendProgressReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return message if no children found', async () => {
      // Arrange
      const mockParent = {
        _id: new Types.ObjectId(mockUser.id),
        firstName: 'Parent',
        lastName: 'Name',
      };

      // @ts-expect-error - Mock type inference issue
      (User.findById as any) = jest.fn().mockResolvedValue(mockParent);
      // @ts-expect-error - Mock type inference issue
      (User.find as any) = jest.fn().mockResolvedValue([]);

      mockRequest.body = { period: 'weekly' };

      // Act
      ParentReportsController.sendProgressReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'No children found',
        sent: false,
      });
    });
  });
});

