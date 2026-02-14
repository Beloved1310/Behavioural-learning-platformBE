/**
 * Unit Tests for BehavioralController
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { BehavioralController } from '../../../controllers/behavioralController';
import { BehavioralService } from '../../../services/behavioralService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { AppError } from '../../../middleware/errorHandler';
import { Types } from 'mongoose';

// Mock dependencies
jest.mock('../../../services/behavioralService');

describe('BehavioralController', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      user: {
        id: '507f1f77bcf86cd799439011',
        role: 'STUDENT' as any,
      },
      body: {},
      query: {},
      params: {},
    } as AuthenticatedRequest;

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as any;

    mockNext = jest.fn();
  });

  describe('trackEvent', () => {
    it('should track event successfully', async () => {
      const mockEvent = {
        _id: new Types.ObjectId(),
        eventType: 'page_view',
        timestamp: new Date(),
      };

      (BehavioralService.trackEvent as jest.MockedFunction<any>).mockResolvedValue(mockEvent);
      (mockRequest.body as any) = {
        eventType: 'page_view',
        eventData: { page: '/dashboard' },
        page: '/dashboard',
      };

      BehavioralController.trackEvent(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.trackEvent).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          eventType: 'page_view',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        event: expect.objectContaining({
          id: expect.any(String),
          eventType: 'page_view',
        }),
      });
    });
  });

  describe('getEventHistory', () => {
    it('should return event history with default limit', async () => {
      const mockEvents = [
        {
          _id: new Types.ObjectId(),
          eventType: 'page_view',
          eventData: {},
          page: '/dashboard',
          timestamp: new Date(),
        },
      ];

      (BehavioralService.getEventHistory as jest.MockedFunction<any>).mockResolvedValue(mockEvents);

      BehavioralController.getEventHistory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getEventHistory).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        undefined,
        50
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        events: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            eventType: 'page_view',
          }),
        ]),
        count: 1,
      });
    });

    it('should return event history with custom limit and eventType', async () => {
      const mockEvents: any[] = [];

      (BehavioralService.getEventHistory as jest.MockedFunction<any>).mockResolvedValue(mockEvents);
      (mockRequest.query as any) = { eventType: 'page_view', limit: '20' };

      BehavioralController.getEventHistory(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getEventHistory).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'page_view',
        20
      );
    });
  });

  describe('getEventCounts', () => {
    it('should return event counts with default days', async () => {
      const mockCounts = { page_view: 10, click: 5 };

      (BehavioralService.getEventCounts as jest.MockedFunction<any>).mockResolvedValue(mockCounts);

      BehavioralController.getEventCounts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getEventCounts).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 30);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        eventCounts: mockCounts,
        period: '30 days',
      });
    });

    it('should return event counts with custom days', async () => {
      const mockCounts = { page_view: 5 };

      (BehavioralService.getEventCounts as jest.MockedFunction<any>).mockResolvedValue(mockCounts);
      (mockRequest.query as any) = { days: '7' };

      BehavioralController.getEventCounts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getEventCounts).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 7);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        eventCounts: mockCounts,
        period: '7 days',
      });
    });
  });

  describe('getPageViews', () => {
    it('should return page views with default days', async () => {
      const mockPageViews = [{ page: '/dashboard', count: 10 }];

      (BehavioralService.getPageViews as jest.MockedFunction<any>).mockResolvedValue(mockPageViews);

      BehavioralController.getPageViews(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getPageViews).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 30);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        pageViews: mockPageViews,
        period: '30 days',
      });
    });
  });

  describe('getBehavioralInsights', () => {
    it('should return behavioral insights', async () => {
      const mockInsights = {
        averageEngagement: 75,
        peakHours: [14, 15, 16],
      };

      (BehavioralService.getBehavioralInsights as jest.MockedFunction<any>).mockResolvedValue(
        mockInsights
      );

      BehavioralController.getBehavioralInsights(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getBehavioralInsights).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        30
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        insights: mockInsights,
        period: '30 days',
      });
    });
  });

  describe('getStudyConsistency', () => {
    it('should return study consistency data', async () => {
      const mockResult = {
        consistencyScore: 85,
        currentStreak: 5,
      };

      (BehavioralService.getStudyConsistency as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      BehavioralController.getStudyConsistency(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getStudyConsistency).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        30
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        consistency: mockResult,
        period: '30 days',
      });
    });
  });

  describe('getConsistencyScore', () => {
    it('should return consistency score', async () => {
      const mockResult = {
        consistencyScore: 85,
        currentStreak: 5,
      };

      (BehavioralService.getStudyConsistency as jest.MockedFunction<any>).mockResolvedValue(
        mockResult
      );

      BehavioralController.getConsistencyScore(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        consistencyScore: 85,
        streak: 5,
        period: '30 days',
      });
    });
  });

  describe('getRecommendations', () => {
    it('should return recommendations with default limit', async () => {
      const mockRecs = [
        {
          _id: new Types.ObjectId(),
          type: 'study_tip',
          title: 'Study Tip',
          description: 'Description',
          priority: 'high',
          metadata: {},
          isRead: false,
          isActioned: false,
          generatedAt: new Date(),
        },
      ];

      (BehavioralService.getRecommendations as jest.MockedFunction<any>).mockResolvedValue(
        mockRecs
      );

      BehavioralController.getRecommendations(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getRecommendations).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        undefined,
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            type: 'study_tip',
          }),
        ]),
        count: 1,
      });
    });

    it('should return recommendations with custom limit and type', async () => {
      const mockRecs: any[] = [];

      (BehavioralService.getRecommendations as jest.MockedFunction<any>).mockResolvedValue(
        mockRecs
      );
      (mockRequest.query as any) = { limit: '5', type: 'study_tip' };

      BehavioralController.getRecommendations(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getRecommendations).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'study_tip',
        5
      );
    });
  });

  describe('generateRecommendations', () => {
    it('should generate new recommendations', async () => {
      const mockRecs = [
        {
          _id: new Types.ObjectId(),
          type: 'study_tip',
          title: 'Study Tip',
          description: 'Description',
          priority: 'high',
          metadata: {},
          generatedAt: new Date(),
        },
      ];

      (BehavioralService.generateRecommendations as jest.MockedFunction<any>).mockResolvedValue(
        mockRecs
      );

      BehavioralController.generateRecommendations(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.generateRecommendations).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
          }),
        ]),
        count: 1,
      });
    });
  });

  describe('markRecommendationAsRead', () => {
    it('should mark recommendation as read', async () => {
      (BehavioralService.markRecommendationAsRead as jest.MockedFunction<any>).mockResolvedValue(
        undefined
      );
      (mockRequest.params as any) = { id: 'rec1' };

      BehavioralController.markRecommendationAsRead(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.markRecommendationAsRead).toHaveBeenCalledWith(
        'rec1',
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recommendation marked as read',
      });
    });
  });

  describe('markRecommendationAsActioned', () => {
    it('should mark recommendation as actioned', async () => {
      (
        BehavioralService.markRecommendationAsActioned as jest.MockedFunction<any>
      ).mockResolvedValue(undefined);
      (mockRequest.params as any) = { id: 'rec1' };

      BehavioralController.markRecommendationAsActioned(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.markRecommendationAsActioned).toHaveBeenCalledWith(
        'rec1',
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recommendation marked as actioned',
      });
    });
  });

  describe('getProgressReports', () => {
    it('should return progress reports with default period and limit', async () => {
      const mockReports = [
        {
          _id: new Types.ObjectId(),
          period: 'weekly',
          startDate: new Date(),
          endDate: new Date(),
          totalStudyTime: 100,
          sessionsCompleted: 5,
          quizzesTaken: 3,
          averageScore: 85,
          streakDays: 7,
          badgesEarned: 2,
          pointsEarned: 100,
          insights: [],
          recommendations: [],
          generatedAt: new Date(),
        },
      ];

      (BehavioralService.getProgressReports as jest.MockedFunction<any>).mockResolvedValue(
        mockReports
      );

      BehavioralController.getProgressReports(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getProgressReports).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'weekly',
        10
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        reports: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            period: 'weekly',
          }),
        ]),
        count: 1,
      });
    });

    it('should return progress reports with monthly period', async () => {
      const mockReports: any[] = [];

      (BehavioralService.getProgressReports as jest.MockedFunction<any>).mockResolvedValue(
        mockReports
      );
      (mockRequest.query as any) = { period: 'monthly', limit: '5' };

      BehavioralController.getProgressReports(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getProgressReports).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'monthly',
        5
      );
    });
  });

  describe('generateProgressReport', () => {
    it('should throw error for MVP', async () => {
      BehavioralController.generateProgressReport(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(501);
      expect(error.message).toContain('Progress reports not available in MVP');
    });
  });

  describe('getSentimentAnalysis', () => {
    it('should return sentiment analysis', async () => {
      const mockSentiment = {
        overall: 'positive',
        score: 0.75,
      };

      (BehavioralService.getSentimentAnalysis as jest.MockedFunction<any>).mockResolvedValue(
        mockSentiment
      );

      BehavioralController.getSentimentAnalysis(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getSentimentAnalysis).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        30
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        sentiment: mockSentiment,
        period: '30 days',
      });
    });
  });

  describe('trackEngagement', () => {
    it('should track engagement with valid event type', async () => {
      const mockEvent = {
        _id: new Types.ObjectId(),
        eventType: 'login',
        timestamp: new Date(),
      };

      (BehavioralService.trackEngagement as jest.MockedFunction<any>).mockResolvedValue(mockEvent);
      (mockRequest.body as any) = {
        eventType: 'login',
        sessionId: 'session1',
        duration: 100,
      };

      BehavioralController.trackEngagement(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.trackEngagement).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          eventType: 'login',
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should throw error when eventType is missing', async () => {
      (mockRequest.body as any) = {};

      BehavioralController.trackEngagement(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('eventType is required');
    });

    it('should map legacy event types', async () => {
      const mockEvent = {
        _id: new Types.ObjectId(),
        eventType: 'login',
        timestamp: new Date(),
      };

      (BehavioralService.trackEngagement as jest.MockedFunction<any>).mockResolvedValue(mockEvent);
      (mockRequest.body as any) = {
        eventType: 'page_view',
      };

      BehavioralController.trackEngagement(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.trackEngagement).toHaveBeenCalled();
    });
  });

  describe('recordBehavioralData', () => {
    it('should record behavioral data successfully', async () => {
      const mockData = {
        _id: new Types.ObjectId(),
        timestamp: new Date(),
      };

      (BehavioralService.recordBehavioralData as jest.MockedFunction<any>).mockResolvedValue(
        mockData
      );
      (mockRequest.body as any) = {
        sessionDuration: 3600,
        actionsPerformed: 10,
        engagementScore: 85,
        mood: 'happy',
        pageViews: 5,
      };

      BehavioralController.recordBehavioralData(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.recordBehavioralData).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          sessionDuration: 3600,
          actionsPerformed: 10,
          engagementScore: 85,
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should throw error when sessionDuration is missing', async () => {
      (mockRequest.body as any) = {
        actionsPerformed: 10,
        engagementScore: 85,
      };

      BehavioralController.recordBehavioralData(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('sessionDuration');
    });

    it('should throw error when sessionDuration is negative', async () => {
      (mockRequest.body as any) = {
        sessionDuration: -1,
        actionsPerformed: 10,
        engagementScore: 85,
      };

      BehavioralController.recordBehavioralData(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('sessionDuration must be >= 0');
    });

    it('should throw error when engagementScore is out of range', async () => {
      (mockRequest.body as any) = {
        sessionDuration: 3600,
        actionsPerformed: 10,
        engagementScore: 150,
      };

      BehavioralController.recordBehavioralData(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0] as any;
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('engagementScore must be between 0 and 100');
    });
  });

  describe('getWeeklyProgressSummary', () => {
    it('should return weekly progress summary', async () => {
      const mockSummary = {
        totalStudyTime: 3600,
        sessionsCompleted: 5,
      };

      (BehavioralService.getWeeklyProgressSummary as jest.MockedFunction<any>).mockResolvedValue(
        mockSummary
      );

      BehavioralController.getWeeklyProgressSummary(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getWeeklyProgressSummary).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011'
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        summary: mockSummary,
      });
    });
  });

  describe('getMotivationalNudges', () => {
    it('should return motivational nudges with default max', async () => {
      const mockNudges = ['Keep going!', "You're doing great!"];

      (BehavioralService.getMotivationalNudges as jest.MockedFunction<any>).mockResolvedValue(
        mockNudges
      );

      BehavioralController.getMotivationalNudges(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getMotivationalNudges).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        3
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        nudges: mockNudges,
      });
    });

    it('should return motivational nudges with custom max', async () => {
      const mockNudges: string[] = [];

      (BehavioralService.getMotivationalNudges as jest.MockedFunction<any>).mockResolvedValue(
        mockNudges
      );
      (mockRequest.query as any) = { max: '5' };

      BehavioralController.getMotivationalNudges(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getMotivationalNudges).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        5
      );
    });
  });

  describe('getReflectionPrompts', () => {
    it('should return reflection prompts', async () => {
      const mockPrompts = ['How did you feel?', 'What did you learn?'];

      (BehavioralService.getReflectionPrompts as jest.MockedFunction<any>).mockResolvedValue(
        mockPrompts
      );
      (mockRequest.query as any) = {
        subject: 'Math',
        duration: '60',
        quizCompleted: 'true',
        score: '85',
      };

      BehavioralController.getReflectionPrompts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getReflectionPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Math',
          duration: 60,
          quizCompleted: true,
          score: 85,
        })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        prompts: mockPrompts,
      });
    });
  });

  describe('getMotivationalPrompts', () => {
    it('should return motivational prompts in legacy format', async () => {
      const mockNudges = ['Keep going!', "You're doing great!"];

      (BehavioralService.getMotivationalNudges as jest.MockedFunction<any>).mockResolvedValue(
        mockNudges
      );

      BehavioralController.getMotivationalPrompts(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(BehavioralService.getMotivationalNudges).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        3
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        prompts: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            icon: expect.any(String),
            priority: 3,
          }),
        ]),
      });
    });
  });
});
