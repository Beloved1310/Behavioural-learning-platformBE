import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { BehavioralService } from '../services/behavioralService';
import { logger } from '../utils/logger';

export class BehavioralController {
  // ============ Custom Event Tracking Endpoints ============

  static trackEvent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { eventType, eventData, page, sessionId } = req.body;
    const userId = req.user!.id;
    const event = await BehavioralService.trackEvent(userId, {
      eventType,
      eventData,
      page,
      sessionId,
    });
    res
      .status(201)
      .json({
        success: true,
        event: {
          id: event._id.toString(),
          eventType: (event as any).eventType,
          timestamp: (event as any).timestamp,
        },
      });
  });

  static getEventHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const eventType = req.query.eventType as string;
    const limit = parseInt(req.query.limit as string) || 50;
    const events = await BehavioralService.getEventHistory(userId, eventType, limit);
    const transformed = (events as any[]).map((event) => ({
      id: event._id.toString(),
      eventType: event.eventType,
      eventData: event.eventData,
      page: event.page,
      timestamp: event.timestamp,
    }));
    res.json({ success: true, events: transformed, count: transformed.length });
  });

  static getEventCounts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const counts = await BehavioralService.getEventCounts(userId, days);
    res.json({ success: true, eventCounts: counts, period: `${days} days` });
  });

  static getPageViews = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const pageViews = await BehavioralService.getPageViews(userId, days);
    res.json({ success: true, pageViews, period: `${days} days` });
  });

  // ============ Behavioral Insights Endpoints ============

  static getBehavioralInsights = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const insights = await BehavioralService.getBehavioralInsights(userId, days);
    res.json({ success: true, insights, period: `${days} days` });
  });

  // Get study consistency analysis
  static getStudyConsistency = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const result = await BehavioralService.getStudyConsistency(userId, days);
    res.json({ success: true, consistency: result, period: `${days} days` });
  });

  // Get consistency score (for dashboard stats)
  static getConsistencyScore = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const result = await BehavioralService.getStudyConsistency(userId, days);

    // Calculate consistency score (0-100)
    const consistencyScore = (result as any).consistencyScore || 0;

    res.json({
      success: true,
      consistencyScore,
      streak: (result as any).currentStreak || 0,
      period: `${days} days`,
    });
  });

  // ============ Recommendations Endpoints ============

  // Get personalized recommendations
  static getRecommendations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const recs = await BehavioralService.getRecommendations(userId, type, limit);
    const transformed = (recs as any[]).map((rec) => ({
      id: rec._id.toString(),
      type: rec.type,
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      metadata: rec.metadata,
      isRead: rec.isRead,
      isActioned: rec.isActioned,
      generatedAt: rec.generatedAt,
    }));
    res.json({ success: true, recommendations: transformed, count: transformed.length });
  });

  // Generate new recommendations based on behavior
  static generateRecommendations = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const newRecs = await BehavioralService.generateRecommendations(userId);
      const transformed = (newRecs as any[]).map((rec) => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        metadata: rec.metadata,
        generatedAt: rec.generatedAt,
      }));
      res
        .status(201)
        .json({ success: true, recommendations: transformed, count: transformed.length });
    }
  );

  // Mark recommendation as read
  static markRecommendationAsRead = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const userId = req.user!.id;
      await BehavioralService.markRecommendationAsRead(id, userId);
      res.json({ success: true, message: 'Recommendation marked as read' });
    }
  );

  // Mark recommendation as actioned
  static markRecommendationAsActioned = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const userId = req.user!.id;
      await BehavioralService.markRecommendationAsActioned(id, userId);
      res.json({ success: true, message: 'Recommendation marked as actioned' });
    }
  );

  // ============ Progress Reports Endpoints ============

  // Get progress reports
  static getProgressReports = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const period = (req.query.period as 'weekly' | 'monthly') || 'weekly';
    const limit = parseInt(req.query.limit as string) || 10;
    const reports = await BehavioralService.getProgressReports(userId, period, limit);
    const transformed = (reports as any[]).map((report) => ({
      id: report._id.toString(),
      period: report.period,
      startDate: report.startDate,
      endDate: report.endDate,
      totalStudyTime: report.totalStudyTime,
      sessionsCompleted: report.sessionsCompleted,
      quizzesTaken: report.quizzesTaken,
      averageScore: report.averageScore,
      streakDays: report.streakDays,
      badgesEarned: report.badgesEarned,
      pointsEarned: report.pointsEarned,
      insights: report.insights,
      recommendations: report.recommendations,
      generatedAt: report.generatedAt,
    }));
    res.json({ success: true, reports: transformed, count: transformed.length });
  });

  // Generate new progress report
  static generateProgressReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Not available in MVP - return error
    throw new AppError(
      'Progress reports not available in MVP. Use weekly progress summary instead.',
      501
    );
  });

  // ============ Sentiment Analysis Endpoints ============

  // Get sentiment analysis from mood and engagement data
  static getSentimentAnalysis = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;
    const sentiment = await BehavioralService.getSentimentAnalysis(userId, days);
    res.json({ success: true, sentiment, period: `${days} days` });
  });

  // ============ MVP: Engagement Tracking ============

  static trackEngagement = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    let { eventType, sessionId, duration, metadata } = req.body;

    if (!eventType) {
      throw new AppError('eventType is required', 400);
    }

    // Map legacy event types to MVP event types
    const eventTypeMap: Record<
      string,
      'login' | 'session_start' | 'session_end' | 'quiz_start' | 'quiz_complete'
    > = {
      page_view: 'login',
      session_join: 'session_start',
      session_leave: 'session_end',
      quiz_attempt: 'quiz_complete',
      button_click: 'login',
      click: 'login',
      form_submit: 'login',
      chat_message: 'login',
      resource_view: 'login',
      search: 'login',
      custom: 'login',
    };

    // If it's a legacy event type, map it
    if (eventTypeMap[eventType]) {
      eventType = eventTypeMap[eventType];
    } else if (
      !['login', 'session_start', 'session_end', 'quiz_start', 'quiz_complete'].includes(eventType)
    ) {
      // For any other unknown event type, default to 'login' to avoid errors
      logger.warn(`[BehavioralController] Unknown event type "${eventType}", mapping to "login"`);
      eventType = 'login';
    }

    // At this point, eventType is guaranteed to be one of the valid MVP types

    const event = await BehavioralService.trackEngagement(userId, {
      eventType: eventType as any,
      sessionId,
      duration,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: {
        id: event._id.toString(),
        eventType: (event as any).eventType,
        timestamp: (event as any).timestamp,
      },
    });
  });

  static recordBehavioralData = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { sessionDuration, actionsPerformed, mood, engagementScore, pageViews } = req.body;

    // Validate required fields (allow 0 values)
    if (
      sessionDuration === undefined ||
      sessionDuration === null ||
      typeof sessionDuration !== 'number'
    ) {
      throw new AppError('sessionDuration is required and must be a number', 400);
    }
    if (
      actionsPerformed === undefined ||
      actionsPerformed === null ||
      typeof actionsPerformed !== 'number'
    ) {
      throw new AppError('actionsPerformed is required and must be a number', 400);
    }
    if (
      engagementScore === undefined ||
      engagementScore === null ||
      typeof engagementScore !== 'number'
    ) {
      throw new AppError('engagementScore is required and must be a number', 400);
    }

    // Validate ranges
    if (sessionDuration < 0) {
      throw new AppError('sessionDuration must be >= 0', 400);
    }
    if (actionsPerformed < 0) {
      throw new AppError('actionsPerformed must be >= 0', 400);
    }
    if (engagementScore < 0 || engagementScore > 100) {
      throw new AppError('engagementScore must be between 0 and 100', 400);
    }

    const data = await BehavioralService.recordBehavioralData(userId, {
      sessionDuration,
      actionsPerformed,
      mood,
      engagementScore,
      pageViews,
    });

    res.status(201).json({
      success: true,
      data: {
        id: data._id.toString(),
        timestamp: (data as any).timestamp,
      },
    });
  });

  // ============ MVP: Basic Progress Summary ============

  static getWeeklyProgressSummary = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const summary = await BehavioralService.getWeeklyProgressSummary(userId);
      res.json({ success: true, summary });
    }
  );

  // ============ MVP: Motivational Nudges ============

  static getMotivationalNudges = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const maxNudges = parseInt(req.query.max as string) || 3;
    const nudges = await BehavioralService.getMotivationalNudges(userId, maxNudges);
    res.json({ success: true, nudges });
  });

  // ============ MVP: Reflection Prompts ============

  static getReflectionPrompts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { subject, duration, quizCompleted, score } = req.query;

    const sessionContext = {
      subject: subject as string | undefined,
      duration: duration ? parseInt(duration as string) : undefined,
      quizCompleted: quizCompleted === 'true',
      score: score ? parseInt(score as string) : undefined,
    };

    const prompts = await BehavioralService.getReflectionPrompts(sessionContext);
    res.json({ success: true, prompts });
  });

  // ============ Legacy: Motivational Prompts (kept for backward compatibility) ============

  static getMotivationalPrompts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const maxPrompts = parseInt(req.query.max as string) || 3;
    const nudges = await BehavioralService.getMotivationalNudges(userId, maxPrompts);
    // Transform to old format for backward compatibility
    const prompts = nudges.map((nudge, index) => ({
      message: nudge,
      icon: ['🔥', '💪', '🎯', '🌟', '🚀'][index] || '✨',
      priority: 3,
    }));
    res.json({ success: true, prompts });
  });
}
