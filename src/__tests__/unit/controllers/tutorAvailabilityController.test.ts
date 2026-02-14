/**
 * Unit Tests for TutorAvailabilityController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TutorAvailabilityController } from '../../../controllers/tutorAvailabilityController';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { Response, NextFunction } from 'express';
import tutorAvailabilityRepository from '../../../repositories/TutorAvailabilityRepository';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/TutorAvailabilityRepository');

describe('TutorAvailabilityController', () => {
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

  describe('setAvailability', () => {
    it('should set tutor availability successfully', async () => {
      // Arrange
      const mockAvailability = {
        _id: new Types.ObjectId(),
        tutorId: new Types.ObjectId(mockUser.id),
        slots: [],
      };

      // @ts-expect-error - Mock type inference issue
      (tutorAvailabilityRepository.deleteByTutor as any) = jest.fn().mockResolvedValue(true);
      // @ts-expect-error - Mock type inference issue
      (tutorAvailabilityRepository.create as any) = jest.fn().mockResolvedValue(mockAvailability);
      mockRequest.body = {
        availabilities: [
          {
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '17:00',
          },
        ],
      };

      // Act
      TutorAvailabilityController.setAvailability(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      // Wait for async handler to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      mockRequest.user = {
        ...mockUser,
        role: UserRole.STUDENT,
      };

      // Act
      await TutorAvailabilityController.setAvailability(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('getAvailability', () => {
    it('should get tutor availability', async () => {
      // Arrange
      const mockAvailability = {
        _id: new Types.ObjectId(),
        tutorId: new Types.ObjectId(mockUser.id),
        slots: [],
      };

      // @ts-expect-error - Mock type inference issue
      (tutorAvailabilityRepository.findByTutor as any) = jest.fn().mockResolvedValue([mockAvailability]);

      // Act
      TutorAvailabilityController.getAvailability(
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

