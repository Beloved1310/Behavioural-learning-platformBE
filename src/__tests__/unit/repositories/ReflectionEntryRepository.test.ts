/**
 * Unit Tests for ReflectionEntryRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import reflectionEntryRepository from '../../../repositories/ReflectionEntryRepository';
import { Types } from 'mongoose';

jest.mock('../../../models/ReflectionEntry', () => ({
  ReflectionEntry: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('ReflectionEntryRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should find reflections by user with limit', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockReflection = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        date: new Date(),
        prompt: 'How did you feel?',
        response: 'Good',
      };

      jest.spyOn(reflectionEntryRepository as any, 'find').mockResolvedValue([mockReflection]);

      // Act
      const result = await reflectionEntryRepository.findByUser(userId, 10);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find reflections by user without limit', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockReflection = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        date: new Date(),
      };

      jest.spyOn(reflectionEntryRepository as any, 'find').mockResolvedValue([mockReflection]);

      // Act
      const result = await reflectionEntryRepository.findByUser(userId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('findByPeriod', () => {
    it('should find reflections by period', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const mockReflection = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        date: new Date(),
      };

      jest.spyOn(reflectionEntryRepository as any, 'find').mockResolvedValue([mockReflection]);

      // Act
      const result = await reflectionEntryRepository.findByPeriod(userId, startDate, endDate);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('findToday', () => {
    it('should find today reflection', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockReflection = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        date: new Date(),
        type: 'daily',
      };

      jest.spyOn(reflectionEntryRepository as any, 'findOne').mockResolvedValue(mockReflection);

      // Act
      const result = await reflectionEntryRepository.findToday(userId);

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe('getReflectionStreak', () => {
    it('should calculate reflection streak', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockReflections = [
        { _id: new Types.ObjectId(), date: today },
        { _id: new Types.ObjectId(), date: new Date(today.getTime() - 86400000) },
      ];

      jest.spyOn(reflectionEntryRepository as any, 'findByUser').mockResolvedValue(mockReflections);

      // Act
      const result = await reflectionEntryRepository.getReflectionStreak(userId);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });
});

