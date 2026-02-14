/**
 * Unit Tests for WeeklyCommitmentRepository
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';
import weeklyCommitmentRepository from '../../../repositories/WeeklyCommitmentRepository';
import { WeeklyCommitment } from '../../../models/WeeklyCommitment';

// Mock the WeeklyCommitment model
jest.mock('../../../models/WeeklyCommitment');

describe('WeeklyCommitmentRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should find commitments by user ID', async () => {
      const userId = new Types.ObjectId().toString();
      const mockCommitments = [
        {
          _id: new Types.ObjectId(),
          userId: new Types.ObjectId(userId),
          weekStart: new Date(),
        },
      ];

      (WeeklyCommitment.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockCommitments);

      const result = await weeklyCommitmentRepository.findByUser(userId);

      expect(WeeklyCommitment.find).toHaveBeenCalledWith(
        {
          userId: new Types.ObjectId(userId),
        },
        null,
        { sort: { weekStart: -1 } }
      );
      expect(result).toEqual(mockCommitments);
    });
  });

  describe('findCurrentWeek', () => {
    it('should find commitment for current week', async () => {
      const userId = new Types.ObjectId().toString();
      const now = new Date();
      const mockCommitment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        weekStart: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1),
      };

      (WeeklyCommitment.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockCommitment
      );

      const result = await weeklyCommitmentRepository.findCurrentWeek(userId);

      expect(WeeklyCommitment.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockCommitment);
    });

    it('should return null when no commitment found for current week', async () => {
      const userId = new Types.ObjectId().toString();

      (WeeklyCommitment.findOne as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await weeklyCommitmentRepository.findCurrentWeek(userId);

      expect(result).toBeNull();
    });
  });

  describe('toggleCommitment', () => {
    it('should toggle commitment item completion', async () => {
      const commitmentId = new Types.ObjectId().toString();
      const mockCommitment = {
        _id: new Types.ObjectId(commitmentId),
        commitments: [
          { text: 'Task 1', completed: false },
          { text: 'Task 2', completed: false },
        ],
        save: (jest.fn() as any).mockResolvedValue(true) as any,
      };

      (WeeklyCommitment.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockCommitment
      );

      const result = await weeklyCommitmentRepository.toggleCommitment(commitmentId, 0);

      expect((result as any).commitments[0].completed).toBe(true);
      expect((result as any).commitments[0].completedAt).toBeDefined();
      expect(mockCommitment.save).toHaveBeenCalled();
    });

    it('should uncomplete commitment item when toggling completed item', async () => {
      const commitmentId = new Types.ObjectId().toString();
      const completedAt = new Date();
      const mockCommitment = {
        _id: new Types.ObjectId(commitmentId),
        commitments: [{ text: 'Task 1', completed: true, completedAt }],
        save: (jest.fn() as any).mockResolvedValue(true) as any,
      };

      (WeeklyCommitment.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockCommitment
      );

      const result = await weeklyCommitmentRepository.toggleCommitment(commitmentId, 0);

      expect((result as any).commitments[0].completed).toBe(false);
      expect((result as any).commitments[0].completedAt).toBeUndefined();
    });

    it('should return null when commitment not found', async () => {
      const commitmentId = new Types.ObjectId().toString();

      (WeeklyCommitment.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(null);

      const result = await weeklyCommitmentRepository.toggleCommitment(commitmentId, 0);

      expect(result).toBeNull();
    });

    it('should not toggle when index is out of bounds', async () => {
      const commitmentId = new Types.ObjectId().toString();
      const mockCommitment = {
        _id: new Types.ObjectId(commitmentId),
        commitments: [{ text: 'Task 1', completed: false }],
        save: (jest.fn() as any).mockResolvedValue(true) as any,
      };

      (WeeklyCommitment.findById as jest.Mock) = (jest.fn() as any).mockResolvedValue(
        mockCommitment
      );

      const result = await weeklyCommitmentRepository.toggleCommitment(commitmentId, 10);

      expect(mockCommitment.save).not.toHaveBeenCalled();
      expect(result).toEqual(mockCommitment);
    });
  });

  describe('findByTutor', () => {
    it('should find commitments assigned by tutor', async () => {
      const tutorId = new Types.ObjectId().toString();
      const mockCommitments = [
        {
          _id: new Types.ObjectId(),
          assignedBy: new Types.ObjectId(tutorId),
          weekStart: new Date(),
        },
      ];

      (WeeklyCommitment.find as jest.Mock) = (jest.fn() as any).mockResolvedValue(mockCommitments);

      const result = await weeklyCommitmentRepository.findByTutor(tutorId);

      expect(WeeklyCommitment.find).toHaveBeenCalledWith(
        {
          assignedBy: new Types.ObjectId(tutorId),
        },
        null,
        { sort: { weekStart: -1 } }
      );
      expect(result).toEqual(mockCommitments);
    });
  });
});
