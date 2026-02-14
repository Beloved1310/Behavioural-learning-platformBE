/**
 * Unit Tests for RecommendationRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import recommendationRepository from '../../../repositories/RecommendationRepository';
import { Types } from 'mongoose';

jest.mock('../../../models/Recommendation', () => ({
  Recommendation: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('RecommendationRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findForUser', () => {
    it('should find recommendations for user with type filter', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockRecommendation = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        type: 'study_plan',
        priority: 5,
        generatedAt: new Date(),
      };

      jest.spyOn(recommendationRepository as any, 'find').mockResolvedValue([mockRecommendation]);

      // Act
      const result = await recommendationRepository.findForUser(userId, 'study_plan', 10);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find recommendations for user without type filter', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockRecommendation = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        priority: 5,
        generatedAt: new Date(),
      };

      jest.spyOn(recommendationRepository as any, 'find').mockResolvedValue([mockRecommendation]);

      // Act
      const result = await recommendationRepository.findForUser(userId, undefined, 10);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('markRead', () => {
    it('should mark recommendation as read', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      jest.spyOn(recommendationRepository as any, 'updateOne').mockResolvedValue({
        _id: new Types.ObjectId(id),
        isRead: true,
      });

      // Act
      const result = await recommendationRepository.markRead(id, userId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('markActioned', () => {
    it('should mark recommendation as actioned', async () => {
      // Arrange
      const id = new Types.ObjectId().toString();
      const userId = new Types.ObjectId().toString();

      jest.spyOn(recommendationRepository as any, 'updateOne').mockResolvedValue({
        _id: new Types.ObjectId(id),
        isActioned: true,
      });

      // Act
      const result = await recommendationRepository.markActioned(id, userId);

      // Assert
      expect(result).toBeDefined();
    });
  });
});

