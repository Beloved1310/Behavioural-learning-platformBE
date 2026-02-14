/**
 * Unit Tests for BehavioralService
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BehavioralService } from '../../../services/behavioralService';
import customEventRepository from '../../../repositories/CustomEventRepository';
import behavioralDataRepository from '../../../repositories/BehavioralDataRepository';
import sessionRepository from '../../../repositories/SessionRepository';
import quizAttemptRepository from '../../../repositories/QuizAttemptRepository';
import userRepository from '../../../repositories/UserRepository';
import { Types } from 'mongoose';

jest.mock('../../../repositories/CustomEventRepository');
jest.mock('../../../repositories/BehavioralDataRepository');
jest.mock('../../../repositories/SessionRepository');
jest.mock('../../../repositories/QuizAttemptRepository');
jest.mock('../../../repositories/UserRepository');

describe('BehavioralService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('trackEngagement', () => {
    it('should track login event', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const eventData = {
        eventType: 'login' as const,
        metadata: { source: 'web' },
      };

      const mockEvent = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        eventType: 'login',
      };

      // @ts-expect-error - Mock type inference issue
      (customEventRepository.createEvent as any) = jest.fn().mockResolvedValue(mockEvent);

      // Act
      const result = await BehavioralService.trackEngagement(userId, eventData);

      // Assert
      expect(customEventRepository.createEvent).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should track session start event', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const sessionId = new Types.ObjectId().toString();
      const eventData = {
        eventType: 'session_start' as const,
        sessionId,
      };

      // @ts-expect-error - Mock type inference issue
      (customEventRepository.createEvent as any) = jest.fn().mockResolvedValue({});

      // Act
      await BehavioralService.trackEngagement(userId, eventData);

      // Assert
      expect(customEventRepository.createEvent).toHaveBeenCalled();
    });

    it('should track quiz complete event', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const eventData = {
        eventType: 'quiz_complete' as const,
        duration: 300,
        metadata: { score: 85 },
      };

      // @ts-expect-error - Mock type inference issue
      (customEventRepository.createEvent as any) = jest.fn().mockResolvedValue({});

      // Act
      await BehavioralService.trackEngagement(userId, eventData);

      // Assert
      expect(customEventRepository.createEvent).toHaveBeenCalled();
    });
  });

  describe('recordBehavioralData', () => {
    it('should record behavioral data successfully', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const data = {
        sessionDuration: 3600,
        actionsPerformed: 50,
        mood: 'happy' as const,
        engagementScore: 85,
        pageViews: [{ page: '/dashboard', time: 100 }],
      };

      const mockData = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        sessionDuration: 3600,
        engagementScore: 85,
      };

      // @ts-expect-error - Mock type inference issue
      (behavioralDataRepository.create as any) = jest.fn().mockResolvedValue(mockData);

      // Act
      const result = await BehavioralService.recordBehavioralData(userId, data);

      // Assert
      expect(behavioralDataRepository.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should record behavioral data without optional fields', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const data = {
        sessionDuration: 1800,
        actionsPerformed: 30,
        engagementScore: 70,
      };

      // @ts-expect-error - Mock type inference issue
      (behavioralDataRepository.create as any) = jest.fn().mockResolvedValue({});

      // Act
      await BehavioralService.recordBehavioralData(userId, data);

      // Assert
      expect(behavioralDataRepository.create).toHaveBeenCalled();
    });
  });

  describe('getWeeklyProgressSummary', () => {
    it('should return weekly progress summary', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const mockSessions = [
        { _id: new Types.ObjectId(), duration: 3600, status: 'completed' },
        { _id: new Types.ObjectId(), duration: 1800, status: 'completed' },
      ];

      const mockQuizzes = [
        { _id: new Types.ObjectId(), score: 85 },
        { _id: new Types.ObjectId(), score: 90 },
      ];

      const mockBehavioralData = [
        { sessionDuration: 3600, engagementScore: 85 },
        { sessionDuration: 1800, engagementScore: 90 },
      ];

      // @ts-expect-error - Mock type inference issue
      (sessionRepository.find as any) = jest.fn().mockResolvedValue(mockSessions);
      // @ts-expect-error - Mock type inference issue
      (quizAttemptRepository.find as any) = jest.fn().mockResolvedValue(mockQuizzes);
      // @ts-expect-error - Mock type inference issue
      (behavioralDataRepository.findSince as any) = jest.fn().mockResolvedValue(mockBehavioralData);

      // Act
      const result = await BehavioralService.getWeeklyProgressSummary(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.sessions.completed).toBe(2);
      expect(result.quizzes.completed).toBe(2);
    });

    it('should handle empty data', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();

      // @ts-expect-error - Mock type inference issue
      (sessionRepository.find as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (quizAttemptRepository.find as any) = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Mock type inference issue
      (behavioralDataRepository.findSince as any) = jest.fn().mockResolvedValue([]);

      // Act
      const result = await BehavioralService.getWeeklyProgressSummary(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result.sessions.completed).toBe(0);
      expect(result.quizzes.completed).toBe(0);
    });
  });
});

