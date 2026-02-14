/**
 * Unit Tests for GoalRepository
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';
import goalRepository from '../../../repositories/GoalRepository';
import { Goal } from '../../../models/Goal';

// Mock the Goal model
jest.mock('../../../models/Goal');

describe('GoalRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should find active goals for user by default', async () => {
      const userId = new Types.ObjectId().toString();
      const mockGoals = [
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), isActive: true },
      ];

      (Goal.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockGoals);

      const result = await goalRepository.findByUser(userId);

      expect(Goal.find).toHaveBeenCalledWith(
        {
          userId: new Types.ObjectId(userId),
          isActive: true,
        },
        null,
        { sort: { createdAt: -1 } }
      );
      expect(result).toEqual(mockGoals);
    });

    it('should find all goals when activeOnly is false', async () => {
      const userId = new Types.ObjectId().toString();
      const mockGoals = [
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), isActive: true },
        { _id: new Types.ObjectId(), userId: new Types.ObjectId(userId), isActive: false },
      ];

      (Goal.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockGoals);

      const result = await goalRepository.findByUser(userId, false);

      expect(Goal.find).toHaveBeenCalledWith(
        {
          userId: new Types.ObjectId(userId),
        },
        null,
        { sort: { createdAt: -1 } }
      );
      expect(result).toEqual(mockGoals);
    });
  });

  describe('updateProgress', () => {
    it('should update goal progress', async () => {
      const goalId = new Types.ObjectId().toString();
      const mockGoal = {
        _id: new Types.ObjectId(goalId),
        current: 50,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [25],
        save: (jest.fn() as any).mockResolvedValue(true),
      };

      (Goal.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockGoal);
      // Ensure save method exists on the returned goal
      if (!mockGoal.save) {
        mockGoal.save = (jest.fn() as any).mockResolvedValue(mockGoal);
      }

      const result = await goalRepository.updateProgress(goalId, 60);

      expect(Goal.findById).toHaveBeenCalledWith(goalId, null, undefined);
      expect(mockGoal.current).toBe(60);
      expect(mockGoal.save).toHaveBeenCalled();
      expect(result).toEqual(mockGoal);
    });

    it('should add new milestones when progress reaches them', async () => {
      const goalId = new Types.ObjectId().toString();
      const mockGoal = {
        _id: new Types.ObjectId(goalId),
        current: 50,
        target: 100,
        milestones: [25, 50, 75, 100],
        achievedMilestones: [25],
        save: (jest.fn() as any).mockResolvedValue(true),
      };

      (Goal.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockGoal);
      // Ensure save method exists on the returned goal
      if (!mockGoal.save) {
        mockGoal.save = (jest.fn() as any).mockResolvedValue(mockGoal);
      }

      const result = await goalRepository.updateProgress(goalId, 75);

      expect((result as any).achievedMilestones).toContain(50);
      expect((result as any).achievedMilestones).toContain(75);
    });

    it('should return null when goal not found', async () => {
      const goalId = new Types.ObjectId().toString();

      (Goal.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await goalRepository.updateProgress(goalId, 50);

      expect(result).toBeNull();
    });
  });

  describe('findByTutor', () => {
    it('should find goals assigned by tutor', async () => {
      const tutorId = new Types.ObjectId().toString();
      const mockGoals = [{ _id: new Types.ObjectId(), assignedBy: new Types.ObjectId(tutorId) }];

      (Goal.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockGoals);

      const result = await goalRepository.findByTutor(tutorId);

      expect(Goal.find).toHaveBeenCalledWith(
        {
          assignedBy: new Types.ObjectId(tutorId),
        },
        null,
        { sort: { createdAt: -1 } }
      );
      expect(result).toEqual(mockGoals);
    });
  });
});
