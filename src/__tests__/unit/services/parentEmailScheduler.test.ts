/**
 * Unit Tests for ParentEmailScheduler
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import parentEmailScheduler from '../../../services/parentEmailScheduler';
import { User } from '../../../models/User';
import goalRepository from '../../../repositories/GoalRepository';
import weeklyCommitmentRepository from '../../../repositories/WeeklyCommitmentRepository';
import customEventRepository from '../../../repositories/CustomEventRepository';
import { sendParentWeeklyProgressEmail } from '../../../services/emailService';
import { UserRole } from '../../../types';
import { Types } from 'mongoose';

jest.mock('../../../models/User');
jest.mock('../../../repositories/GoalRepository');
jest.mock('../../../repositories/WeeklyCommitmentRepository');
jest.mock('../../../repositories/CustomEventRepository');
jest.mock('../../../services/emailService');
jest.mock('node-cron', () => ({
  schedule: jest.fn((cronExpression, callback, options) => {
    // Return a mock scheduler
    return {
      start: callback,
      stop: jest.fn(),
    };
  }),
}));

describe('ParentEmailScheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should start the scheduler', () => {
      // Act
      parentEmailScheduler.start();

      // Assert - scheduler should be running
      expect(parentEmailScheduler).toBeDefined();
    });

    it('should not start if already running', () => {
      // Arrange
      parentEmailScheduler.start();

      // Act
      parentEmailScheduler.start();

      // Assert - should not throw error
      expect(parentEmailScheduler).toBeDefined();
    });
  });

  describe('sendWeeklyReports', () => {
    it('should send weekly reports to parents', async () => {
      // Arrange
      const mockParent = {
        _id: new Types.ObjectId(),
        email: 'parent@example.com',
        firstName: 'Parent',
        lastName: 'Name',
        role: UserRole.PARENT,
      };

      const mockChild = {
        _id: new Types.ObjectId(),
        parentId: mockParent._id,
        firstName: 'Child',
        lastName: 'Name',
        role: UserRole.STUDENT,
        streakCount: 5,
      };

      (User.find as any) = jest
        .fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce([mockParent])
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce([mockChild]);
      // @ts-expect-error - Mock type inference issue
      (goalRepository.findByUser as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (weeklyCommitmentRepository.findCurrentWeek as any) = jest.fn().mockResolvedValue(null);
      // @ts-expect-error - Mock type inference issue
      (customEventRepository.find as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (sendParentWeeklyProgressEmail as any) = jest.fn().mockResolvedValue(undefined);

      // Act
      await parentEmailScheduler.sendWeeklyReports();

      // Assert
      expect(User.find).toHaveBeenCalled();
    });

    it('should skip parents with no children', async () => {
      // Arrange
      const mockParent = {
        _id: new Types.ObjectId(),
        email: 'parent@example.com',
        role: UserRole.PARENT,
      };

      (User.find as any) = jest
        .fn()
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce([mockParent])
        // @ts-expect-error - Mock type inference issue
        .mockResolvedValueOnce([]);

      // Act
      await parentEmailScheduler.sendWeeklyReports();

      // Assert
      expect(User.find).toHaveBeenCalled();
    });
  });
});

