/**
 * Unit Tests for MilestoneService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import milestoneService from '../../../services/milestoneService';
import goalRepository from '../../../repositories/GoalRepository';
import userRepository from '../../../repositories/UserRepository';
import badgeRepository from '../../../repositories/BadgeRepository';
import userBadgeRepository from '../../../repositories/UserBadgeRepository';
import notificationService from '../../../services/notificationService';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';
import { BadgeType } from '../../../types';

// Mock dependencies
jest.mock('../../../repositories/GoalRepository');
jest.mock('../../../repositories/UserRepository');
jest.mock('../../../repositories/BadgeRepository');
jest.mock('../../../repositories/UserBadgeRepository');
jest.mock('../../../services/notificationService');

describe('MilestoneService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUpcoming', () => {
    it('should return upcoming milestone when goal has progress', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 3,
      };
      const mockGoal = {
        _id: new Types.ObjectId(),
        title: 'Complete 100 exercises',
        current: 30,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [],
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([mockGoal]);

      // Act
      const result = await milestoneService.getUpcoming(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.type).toBe('goal');
      if (result && 'goalTitle' in result) {
        expect(result.goalTitle).toBe('Complete 100 exercises');
      }
    });

    it('should return streak milestone when user has low streak', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 3,
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await milestoneService.getUpcoming(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.type).toBe('streak');
      expect(result?.target).toBe(7);
    });

    it('should return null when no milestones are upcoming', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 100,
      };
      const mockGoal = {
        _id: new Types.ObjectId(),
        title: 'Complete 100 exercises',
        current: 100,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [25, 50, 75, 100],
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([mockGoal]);

      // Act
      const result = await milestoneService.getUpcoming(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(milestoneService.getUpcoming(userId)).rejects.toThrow(AppError);
      await expect(milestoneService.getUpcoming(userId)).rejects.toThrow('User not found');
    });
  });

  describe('checkMilestones', () => {
    it('should detect and award streak milestones', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 7,
      };
      const mockBadge = {
        _id: new Types.ObjectId(),
        type: BadgeType.MILESTONE,
        name: '7-Day Streak',
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([]);
      (badgeRepository.findOne as jest.MockedFunction<any>).mockResolvedValue(mockBadge);
      (userBadgeRepository.findOne as jest.MockedFunction<any>).mockResolvedValue(null);
      (notificationService.notifyMilestoneAchieved as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );

      // Act
      const result = await milestoneService.checkMilestones(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.hasNewMilestones).toBe(true);
      expect(result.newMilestones.length).toBeGreaterThan(0);
    });

    it('should detect and award goal milestones', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 0,
      };
      const mockGoal = {
        _id: new Types.ObjectId(),
        title: 'Complete 100 exercises',
        current: 30,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [],
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([mockGoal]);
      (notificationService.notifyMilestoneAchieved as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );

      // Act
      const result = await milestoneService.checkMilestones(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.hasNewMilestones).toBe(true);
      expect(result.newMilestones.some((m: any) => m.type === 'goal')).toBe(true);
    });

    it('should not award already achieved milestones', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 7,
      };
      const mockBadge = {
        _id: new Types.ObjectId(),
        type: BadgeType.MILESTONE,
        name: '7-Day Streak',
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([]);
      (badgeRepository.findOne as jest.MockedFunction<any>).mockResolvedValue(mockBadge);
      (userBadgeRepository.findOne as jest.MockedFunction<any>).mockResolvedValue({
        _id: new Types.ObjectId(),
      }); // Badge already exists

      // Act
      const result = await milestoneService.checkMilestones(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.hasNewMilestones).toBe(false);
    });

    it('should throw error when user not found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(null);

      // Act & Assert
      await expect(milestoneService.checkMilestones(userId)).rejects.toThrow(AppError);
      await expect(milestoneService.checkMilestones(userId)).rejects.toThrow('User not found');
    });

    it('should return empty array when no new milestones', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: new Types.ObjectId(userId),
        streakCount: 0,
      };

      (userRepository.findById as jest.MockedFunction<any>).mockResolvedValue(mockUser);
      (goalRepository.findByUser as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await milestoneService.checkMilestones(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.hasNewMilestones).toBe(false);
      expect(result.newMilestones.length).toBe(0);
    });
  });
});
