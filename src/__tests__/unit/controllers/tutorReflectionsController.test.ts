/**
 * Unit Tests for TutorReflectionsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorReflectionsController } from '../../../controllers/tutorReflectionsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import reflectionEntryRepository from '../../../repositories/ReflectionEntryRepository';
import userRepository from '../../../repositories/UserRepository';
import notificationService from '../../../services/notificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/ReflectionEntryRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/notificationService');

describe('TutorReflectionsController', () => {
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

  describe('getStudentReflections', () => {
    it('should return student reflections with pagination', async () => {
      // Arrange
      const studentId = new Types.ObjectId().toString();
      const mockStudent = {
        _id: new Types.ObjectId(studentId),
        role: UserRole.STUDENT,
      };

      const mockReflection = {
        _id: new Types.ObjectId(),
        date: new Date(),
        prompt: 'How did you feel today?',
        response: 'I felt good',
        type: 'daily',
        mood: 'happy',
        tutorFeedback: null,
        createdAt: new Date(),
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockStudent);
      // @ts-expect-error - Mock type inference issue
      (reflectionEntryRepository.findByUser as any) = jest.fn().mockResolvedValue([mockReflection]);

      mockRequest.params = { studentId };

      // Act
      TutorReflectionsController.getStudentReflections(
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
      expect(callArgs.reflections).toBeDefined();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };
      mockRequest.params = { studentId: new Types.ObjectId().toString() };

      // Act
      await TutorReflectionsController.getStudentReflections(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('addFeedback', () => {
    it('should add feedback to reflection successfully', async () => {
      // Arrange
      const reflectionId = new Types.ObjectId().toString();
      const studentId = new Types.ObjectId().toString();
      const mockReflection = {
        _id: new Types.ObjectId(reflectionId),
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
      (reflectionEntryRepository.findById as any) = jest.fn().mockResolvedValue(mockReflection);
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockTutor);
      // @ts-expect-error - Mock type inference issue
      (notificationService.notifyReflectionFeedback as any) = jest.fn().mockResolvedValue(undefined);

      mockRequest.params = { reflectionId };
      mockRequest.body = { comment: 'Great work!' };

      // Act
      TutorReflectionsController.addFeedback(
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
      mockRequest.params = { reflectionId: new Types.ObjectId().toString() };
      mockRequest.body = {};

      // Act
      await TutorReflectionsController.addFeedback(
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

