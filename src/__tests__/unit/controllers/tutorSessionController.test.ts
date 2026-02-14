/**
 * Unit Tests for TutorSessionController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorSessionController } from '../../../controllers/tutorSessionController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import sessionRepository from '../../../repositories/SessionRepository';
import userRepository from '../../../repositories/UserRepository';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

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

describe('TutorSessionController', () => {
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

  describe('getPendingRequests', () => {
    it('should return pending session requests', async () => {
      // Arrange
      const { Session } = await import('../../../models/Session');
      const mockSession = {
        _id: new Types.ObjectId(),
        tutorId: new Types.ObjectId(mockUser.id),
        studentId: { _id: new Types.ObjectId(), firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        scheduledAt: new Date(),
        duration: 60,
        title: 'Test Session',
        subject: 'Math',
        description: 'Test',
        price: 50,
        createdAt: new Date(),
      };

      // @ts-expect-error - Mock type inference issue
      (Session.countDocuments as any) = jest.fn().mockResolvedValue(1);
      (Session.find as any) = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              // @ts-expect-error - Mock type inference issue
              limit: jest.fn().mockResolvedValue([mockSession]),
            }),
          }),
        }),
      });

      // Act
      TutorSessionController.getPendingRequests(
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

  describe('approveRequest', () => {
    it('should approve session request successfully', async () => {
      // Arrange
      const sessionId = new Types.ObjectId().toString();
      const { Session } = await import('../../../models/Session');
      const scheduledAtDate = new Date();
      const mockPopulatedSession: any = {
        _id: new Types.ObjectId(sessionId),
        tutorId: new Types.ObjectId(mockUser.id), // Ensure tutorId matches
        status: 'pending',
        scheduledAt: scheduledAtDate,
        duration: 60,
        title: 'Test Session',
        subject: 'Math',
        studentId: {
          _id: new Types.ObjectId(),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };
      
      (Session.findById as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue(mockPopulatedSession),
      });
      // Mock Session.find for conflict checking
      // The controller chains: find().select().lean()
      (Session.find as any) = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          // @ts-expect-error - Mock type inference issue
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      // Mock Session.findOneAndUpdate (used for atomic update)
      const updatedSession: any = {
        ...mockPopulatedSession,
        status: 'scheduled',
      };
      (Session.findOneAndUpdate as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue(updatedSession),
      });
      mockRequest.params = { id: sessionId };

      // Act
      TutorSessionController.approveRequest(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if session not found', async () => {
      // Arrange
      const { Session } = await import('../../../models/Session');
      (Session.findById as any) = jest.fn().mockReturnValue({
        // @ts-expect-error - Mock type inference issue
        populate: jest.fn().mockResolvedValue(null),
      });
      mockRequest.params = { id: new Types.ObjectId().toString() };

      // Act
      await TutorSessionController.approveRequest(
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

