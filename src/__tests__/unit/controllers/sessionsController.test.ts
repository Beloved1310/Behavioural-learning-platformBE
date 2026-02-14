/**
 * Unit Tests for SessionsController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SessionsController } from '../../../controllers/sessionsController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import { Session } from '../../../models/Session';
import sessionRepository from '../../../repositories/SessionRepository';
import userRepository from '../../../repositories/UserRepository';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../models/Session');
jest.mock('../../../repositories/SessionRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../socket', () => ({
  getIO: jest.fn().mockReturnValue({
    to: jest.fn().mockReturnValue({
      emit: jest.fn(),
    }),
  }),
  // @ts-expect-error - Mock type inference issue
  sendNotificationToUser: jest.fn().mockResolvedValue(undefined),
}));

describe('SessionsController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      id: new Types.ObjectId().toString(),
      role: UserRole.STUDENT,
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

  describe('getUserSessions', () => {
    it('should return user sessions with pagination', async () => {
      // Arrange
      const sessionId = new Types.ObjectId();
      const mockSession = {
        _id: sessionId,
        studentId: new Types.ObjectId(mockUser.id),
        tutorId: new Types.ObjectId(),
        title: 'Math Session',
        scheduledAt: new Date(),
        duration: 60,
        status: 'scheduled',
      };

      // @ts-expect-error - Mock type inference issue
      (Session.countDocuments as any) = jest.fn().mockResolvedValue(1);
      (Session.find as jest.Mock) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                // @ts-expect-error - Mock type inference issue
                limit: jest.fn().mockResolvedValue([mockSession]),
              }),
            }),
          }),
        }),
      });

      // Act
      SessionsController.getUserSessions(
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
      expect(callArgs.data.sessions).toBeDefined();
    });
  });

  describe('getSessionById', () => {
    it('should return session by ID for authorized user', async () => {
      // Arrange
      const sessionId = new Types.ObjectId();
      const studentId = new Types.ObjectId(mockUser.id);
      const mockSession = {
        _id: sessionId,
        studentId: { _id: studentId },
        tutorId: null,
        title: 'Math Session',
        scheduledAt: new Date(),
        duration: 60,
        status: 'scheduled',
      };

      (Session.findById as jest.Mock) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          populate: jest.fn().mockResolvedValue(mockSession),
        }),
      });

      mockRequest.params = { id: sessionId.toString() };

      // Act
      await SessionsController.getSessionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      // Arrange
      (Session.findById as jest.Mock) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      mockRequest.params = { id: new Types.ObjectId().toString() };

      // Act
      await SessionsController.getSessionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      // Arrange
      const sessionId = new Types.ObjectId();
      const startTime = new Date().toISOString();
      mockRequest.body = {
        title: 'New Session',
        subject: 'Math',
        startTime: startTime,
        duration: 60,
      };

      const scheduledAt = new Date(startTime);
      const mockSession: any = {
        _id: sessionId,
        studentId: new Types.ObjectId(mockUser.id),
        tutorId: null, // Will be set when tutor approves
        status: 'pending',
        title: mockRequest.body.title,
        subject: mockRequest.body.subject,
        scheduledAt: scheduledAt,
        duration: mockRequest.body.duration,
        type: undefined,
        description: undefined,
        isRecurring: false,
        reminderEnabled: true,
        reminderTime: 15,
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      // @ts-expect-error - Mock type inference issue
      mockSession.populate = jest.fn().mockResolvedValue(mockSession);

      // Mock Session.find for duplicate checking (returns empty array)
      (Session.find as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        limit: jest.fn().mockResolvedValue([]),
      });
      // @ts-expect-error - Mock type inference issue
      (Session.create as jest.Mock) = jest.fn().mockResolvedValue(mockSession);

      // Act
      SessionsController.createSession(
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
  });

  describe('updateSession', () => {
    it('should update session successfully', async () => {
      // Arrange
      const sessionId = new Types.ObjectId();
      const studentId = new Types.ObjectId(mockUser.id);
      const mockSession: any = {
        _id: sessionId,
        studentId: studentId,
        tutorId: null,
        status: 'pending',
        scheduledAt: new Date(),
        duration: 60,
        title: 'Test Session',
        subject: 'Math',
      };
      // @ts-expect-error - Mock type inference issue
      mockSession.save = jest.fn().mockResolvedValue(mockSession);
      // @ts-expect-error - Mock type inference issue
      mockSession.populate = jest.fn().mockResolvedValue(mockSession);

      // @ts-expect-error - Mock type inference issue
      (Session.findById as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      // Mock User.findById for notification
      const { User } = await import('../../../models/User');
      // @ts-expect-error - Mock type inference issue
      (User.findById as any) = jest.fn().mockResolvedValue({
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
      });
      mockRequest.params = { id: sessionId.toString() };
      mockRequest.body = { title: 'Updated Title' };

      // Act
      SessionsController.updateSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      // Arrange
      const sessionId = new Types.ObjectId();
      const studentId = new Types.ObjectId(mockUser.id);
      const mockSession: any = {
        _id: sessionId,
        studentId: studentId,
        tutorId: null,
        status: 'pending',
      };

      // deleteSession uses Session.findById and then Session.findByIdAndDelete
      // @ts-expect-error - Mock type inference issue
      (Session.findById as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      // @ts-expect-error - Mock type inference issue
      (Session.findByIdAndDelete as jest.Mock) = jest.fn().mockResolvedValue(mockSession);
      // Mock User.findById for notification (won't be called if tutorId is null)
      const { User } = await import('../../../models/User');
      // @ts-expect-error - Mock type inference issue
      (User.findById as any) = jest.fn().mockResolvedValue({
        _id: studentId,
        firstName: 'John',
        lastName: 'Doe',
      });
      mockRequest.params = { id: sessionId.toString() };

      // Act
      SessionsController.deleteSession(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });
});
