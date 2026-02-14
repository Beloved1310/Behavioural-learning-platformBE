/**
 * Unit Tests for AdminService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AdminService } from '../../../services/adminService';
import userRepository from '../../../repositories/UserRepository';
import notificationService from '../../../services/notificationService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../repositories/UserRepository');
jest.mock('../../../services/notificationService');

describe('AdminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPendingTutors', () => {
    it('should return pending tutors', async () => {
      // Arrange
      const mockTutor = {
        _id: new Types.ObjectId(),
        firstName: 'John',
        lastName: 'Doe',
        email: 'tutor@example.com',
        isVerified: false,
        isBackgroundChecked: false,
        createdAt: new Date(),
      };

      (userRepository as any).model = {
        // @ts-expect-error - Mock type inference issue
        countDocuments: jest.fn().mockResolvedValue(1),
        find: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  // @ts-expect-error - Mock type inference issue
                  lean: jest.fn().mockResolvedValue([mockTutor]),
                }),
              }),
            }),
          }),
        }),
      };

      // Act
      const result = await AdminService.getPendingTutors(1, 20);

      // Assert
      expect(result).toBeDefined();
      expect(result.tutors).toBeDefined();
      expect(result.tutors.length).toBe(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getTutorById', () => {
    it('should return tutor by ID', async () => {
      // Arrange
      const tutorId = new Types.ObjectId().toString();
      const mockTutor = {
        _id: new Types.ObjectId(tutorId),
        firstName: 'John',
        lastName: 'Doe',
        email: 'tutor@example.com',
        role: UserRole.TUTOR,
        isVerified: true,
        isBackgroundChecked: true,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockTutor);

      // Act
      const result = await AdminService.getTutorById(tutorId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe(tutorId);
      expect(result.firstName).toBe('John');
    });

    it('should throw error if tutor not found', async () => {
      // Arrange
      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(AdminService.getTutorById(new Types.ObjectId().toString())).rejects.toThrow(
        'Tutor not found'
      );
    });

    it('should throw error if user is not a tutor', async () => {
      // Arrange
      const mockUser = {
        _id: new Types.ObjectId(),
        role: UserRole.STUDENT,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockUser);

      // Act & Assert
      await expect(AdminService.getTutorById(new Types.ObjectId().toString())).rejects.toThrow(
        'User is not a tutor'
      );
    });
  });

  describe('approveTutor', () => {
    it('should approve tutor successfully', async () => {
      // Arrange
      const tutorId = new Types.ObjectId().toString();
      const mockTutor = {
        _id: new Types.ObjectId(tutorId),
        role: UserRole.TUTOR,
        isVerified: false,
        isBackgroundChecked: false,
      };

      const updatedTutor = {
        ...mockTutor,
        isVerified: true,
        isBackgroundChecked: true,
      };

      // @ts-expect-error - Mock type inference issue
      (userRepository.findById as any) = jest.fn().mockResolvedValue(mockTutor);
      // @ts-expect-error - Mock type inference issue
      (userRepository.updateById as any) = jest.fn().mockResolvedValue(updatedTutor);
      // @ts-expect-error - Mock type inference issue
      (notificationService.notifyTutorApproved as any) = jest.fn().mockResolvedValue(undefined);

      // Act
      const result = await AdminService.approveTutor(tutorId);

      // Assert
      expect(result).toBeDefined();
      expect(userRepository.updateById).toHaveBeenCalledWith(
        tutorId,
        expect.objectContaining({
          isVerified: true,
          isBackgroundChecked: true,
        })
      );
    });
  });
});

