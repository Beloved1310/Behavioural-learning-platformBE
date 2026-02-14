/**
 * Unit Tests for SessionRepository
 *
 * Coverage Goals: 80%+ for repositories
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Session } from '../../../models/Session';
import { sessionRepository } from '../../../repositories/SessionRepository';
import { Types } from 'mongoose';

// Mock Session model
jest.mock('../../../models/Session');

describe('SessionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aggregateStudyStats', () => {
    it('should aggregate study statistics for a user', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const startDate = new Date('2024-01-01');
      const mockStats = [
        {
          _id: null,
          totalSessions: 10,
          completedSessions: 8,
          totalDuration: 800, // minutes
        },
      ];

      (Session.aggregate as jest.MockedFunction<any>).mockResolvedValue(mockStats);

      // Act
      const result = await sessionRepository.aggregateStudyStats(userId, startDate);

      // Assert
      expect(Session.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].totalSessions).toBe(10);
      expect(result[0].completedSessions).toBe(8);
      expect(result[0].totalDuration).toBe(800);
    });

    it('should return empty array when no sessions found', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const startDate = new Date('2024-01-01');

      (Session.aggregate as jest.MockedFunction<any>).mockResolvedValue([]);

      // Act
      const result = await sessionRepository.aggregateStudyStats(userId, startDate);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('dailyPattern', () => {
    it('should return daily session patterns', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const startDate = new Date('2024-01-01');
      const mockPattern = [
        {
          _id: '2024-01-15',
          sessionCount: 2,
          totalMinutes: 120,
        },
        {
          _id: '2024-01-16',
          sessionCount: 1,
          totalMinutes: 60,
        },
      ];

      (Session.aggregate as jest.MockedFunction<any>).mockResolvedValue(mockPattern);

      // Act
      const result = await sessionRepository.dailyPattern(userId, startDate);

      // Assert
      expect(Session.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe('2024-01-15');
      expect(result[0].sessionCount).toBe(2);
    });
  });

  describe('weeklyPattern', () => {
    it('should return weekly session patterns by day of week', async () => {
      // Arrange
      const userId = '507f1f77bcf86cd799439011';
      const startDate = new Date('2024-01-01');
      const mockPattern = [
        {
          _id: 1, // Monday
          sessionCount: 5,
          avgDuration: 60,
        },
        {
          _id: 2, // Tuesday
          sessionCount: 3,
          avgDuration: 45,
        },
      ];

      (Session.aggregate as jest.MockedFunction<any>).mockResolvedValue(mockPattern);

      // Act
      const result = await sessionRepository.weeklyPattern(userId, startDate);

      // Assert
      expect(Session.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]._id).toBe(1);
      expect(result[0].sessionCount).toBe(5);
      expect(result[0].avgDuration).toBe(60);
    });
  });

  describe('BaseRepository methods', () => {
    it('should create a session', async () => {
      // Arrange
      const sessionData = {
        title: 'Math Session',
        studentId: new Types.ObjectId(),
        tutorId: new Types.ObjectId(),
        scheduledAt: new Date(),
        duration: 60,
        status: 'scheduled' as const,
      };

      const mockSession = {
        _id: new Types.ObjectId(),
        ...sessionData,
      };

      (Session.create as jest.MockedFunction<any>).mockResolvedValue(mockSession);

      // Act
      const result = await sessionRepository.create(sessionData as any);

      // Assert
      expect(Session.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should find session by ID', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011';
      const mockSession = {
        _id: new Types.ObjectId(sessionId),
        title: 'Math Session',
      };

      (Session.findById as jest.MockedFunction<any>).mockResolvedValue(mockSession);

      // Act
      const result = await sessionRepository.findById(sessionId);

      // Assert
      expect(Session.findById).toHaveBeenCalledWith(sessionId, null, undefined);
      expect(result).toBeDefined();
    });

    it('should update session', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011';
      const updateData = { status: 'completed' as const };
      const mockSession = {
        _id: new Types.ObjectId(sessionId),
        title: 'Math Session',
        status: 'completed',
      };

      (Session.findOneAndUpdate as jest.MockedFunction<any>).mockResolvedValue({
        ...mockSession,
        ...updateData,
      });

      // Act
      const result = await sessionRepository.updateOne(
        { _id: new Types.ObjectId(sessionId) } as any,
        updateData as any
      );

      // Assert
      expect(Session.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should delete session by ID', async () => {
      // Arrange
      const sessionId = '507f1f77bcf86cd799439011';

      (Session.findByIdAndDelete as jest.MockedFunction<any>).mockResolvedValue(true);

      // Act
      const result = await sessionRepository.deleteById(sessionId);

      // Assert
      expect(Session.findByIdAndDelete).toHaveBeenCalledWith(sessionId);
      expect(result).toBeDefined();
    });
  });
});
