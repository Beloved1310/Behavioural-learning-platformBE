/**
 * Unit Tests for ProgressReportRepository
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import progressReportRepository from '../../../repositories/ProgressReportRepository';
import { Types } from 'mongoose';

jest.mock('../../../models/ProgressReport', () => ({
  ProgressReport: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

describe('ProgressReportRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findForUser', () => {
    it('should find reports for user with period filter', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockReport = {
        _id: new Types.ObjectId(),
        studentId: new Types.ObjectId(userId),
        period: 'weekly',
        generatedAt: new Date(),
      };

      // Mock the base repository find method
      jest.spyOn(progressReportRepository as any, 'find').mockResolvedValue([mockReport]);

      // Act
      const result = await progressReportRepository.findForUser(userId, 'weekly', 10);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find reports for user without period filter', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockReport = {
        _id: new Types.ObjectId(),
        studentId: new Types.ObjectId(userId),
        generatedAt: new Date(),
      };

      jest.spyOn(progressReportRepository as any, 'find').mockResolvedValue([mockReport]);

      // Act
      const result = await progressReportRepository.findForUser(userId, undefined, 10);

      // Assert
      expect(result).toBeDefined();
    });
  });
});

