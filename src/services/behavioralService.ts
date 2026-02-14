import { Types } from 'mongoose';
import { AppError } from '../middleware/errorHandler';
import customEventRepository from '../repositories/CustomEventRepository';
import behavioralDataRepository from '../repositories/BehavioralDataRepository';
import sessionRepository from '../repositories/SessionRepository';
import quizAttemptRepository from '../repositories/QuizAttemptRepository';
import userRepository from '../repositories/UserRepository';
import { GeminiService } from './geminiService';
import { logger } from '../utils/logger';

export class BehavioralService {
  // ============ Engagement Tracking ============

  /**
   * Track engagement event (login, session start, etc.)
   */
  static async trackEngagement(
    userId: string,
    data: {
      eventType: 'login' | 'session_start' | 'session_end' | 'quiz_start' | 'quiz_complete';
      sessionId?: string;
      duration?: number; // in seconds
      metadata?: Record<string, any>;
    }
  ) {
    return customEventRepository.createEvent({
      userId: new Types.ObjectId(userId) as any,
      eventType: data.eventType as any,
      eventData: data.metadata || {},
      page: undefined,
      sessionId: data.sessionId as any,
      timestamp: new Date() as any,
    });
  }

  /**
   * Record behavioral data (session duration, engagement score)
   */
  static async recordBehavioralData(
    userId: string,
    data: {
      sessionDuration: number; // in seconds
      actionsPerformed: number;
      mood?: 'happy' | 'neutral' | 'frustrated' | 'confused';
      engagementScore: number; // 0-100
      pageViews?: any;
    }
  ) {
    return behavioralDataRepository.create({
      userId: new Types.ObjectId(userId) as any,
      sessionDuration: data.sessionDuration as any,
      actionsPerformed: data.actionsPerformed as any,
      mood: data.mood as any,
      engagementScore: data.engagementScore as any,
      pageViews: data.pageViews as any,
      timestamp: new Date() as any,
    });
  }

  // ============ Basic Progress Summary ============

  /**
   * Get weekly progress summary (quiz completion, session participation)
   */
  static async getWeeklyProgressSummary(userId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const [sessions, quizzes, behavioralData] = await Promise.all([
      sessionRepository.find({
        studentId: new Types.ObjectId(userId),
        scheduledAt: { $gte: weekStart },
        status: 'completed',
      } as any),
      quizAttemptRepository.find({
        studentId: new Types.ObjectId(userId),
        completedAt: { $gte: weekStart },
      } as any),
      behavioralDataRepository.findSince(userId, weekStart),
    ]);

    const totalSessionDuration = (sessions as any[]).reduce(
      (sum: number, s: any) => sum + (s.duration || 0),
      0
    );
    const totalEngagementTime = (behavioralData as any[]).reduce(
      (sum: number, d: any) => sum + (d.sessionDuration || 0),
      0
    );

    return {
      weekStart: weekStart,
      weekEnd: now,
      sessions: {
        completed: (sessions as any[]).length,
        totalDuration: totalSessionDuration, // in minutes
      },
      quizzes: {
        completed: (quizzes as any[]).length,
        averageScore:
          (quizzes as any[]).length > 0
            ? Math.round(
                (quizzes as any[]).reduce((sum: number, q: any) => sum + (q.percentage || 0), 0) /
                  (quizzes as any[]).length
              )
            : 0,
      },
      engagement: {
        totalTime: Math.round(totalEngagementTime / 60), // in minutes
        averageScore:
          (behavioralData as any[]).length > 0
            ? Math.round(
                (behavioralData as any[]).reduce(
                  (sum: number, d: any) => sum + (d.engagementScore || 0),
                  0
                ) / (behavioralData as any[]).length
              )
            : 0,
      },
    };
  }

  // ============ Motivational Nudges ============

  /**
   * Get motivational nudges (AI-generated or template-based)
   */
  static async getMotivationalNudges(userId: string, maxNudges: number = 3): Promise<string[]> {
    const user = await userRepository.findByIdWithFields(userId, 'streakCount lastLoginAt');

    // Get recent activity context
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [quizzesThisWeek, lastLogin] = await Promise.all([
      quizAttemptRepository.find({
        studentId: new Types.ObjectId(userId),
        completedAt: { $gte: weekStart },
      } as any),
      user ? (user as any).lastLoginAt : null,
    ]);

    const lastLoginDaysAgo = lastLogin
      ? Math.floor((now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    const userContext = {
      currentStreak: (user as any)?.streakCount || 0,
      lastLoginDaysAgo,
      quizzesCompletedThisWeek: (quizzesThisWeek as any[]).length,
    };

    // Try AI-generated nudges first
    if (GeminiService.isAvailable()) {
      try {
        const aiNudges = await GeminiService.generateMotivationalNudges(userContext);
        if (aiNudges && aiNudges.length > 0) {
          return aiNudges.slice(0, maxNudges);
        }
      } catch (error) {
        logger.error('[BehavioralService] AI nudge generation failed, using templates', error);
      }
    }

    // Fallback to template-based nudges
    return this.getTemplateNudges(userContext, maxNudges);
  }

  /**
   * Template-based nudges (fallback when AI unavailable)
   * Enhanced with more variety for Behavior Nudges feature
   */
  private static getTemplateNudges(
    context: {
      currentStreak?: number;
      lastLoginDaysAgo?: number;
      quizzesCompletedThisWeek?: number;
    },
    maxNudges: number
  ): string[] {
    const nudges: string[] = [];

    // Streak-based nudges
    if (context.currentStreak && context.currentStreak > 0) {
      if (context.currentStreak >= 7) {
        nudges.push(
          `Incredible! You're on a ${context.currentStreak}-day streak! 🎉 You're unstoppable!`
        );
      } else if (context.currentStreak >= 3) {
        nudges.push(`Amazing! You're on a ${context.currentStreak}-day streak! 🔥 Keep it up!`);
      } else {
        nudges.push(`Great start! You're on a ${context.currentStreak}-day streak! Keep going!`);
      }
    } else {
      nudges.push('Try setting a goal for tomorrow!');
      nudges.push('Start a learning streak today - every day counts!');
    }

    // Activity-based nudges
    if (context.lastLoginDaysAgo !== undefined && context.lastLoginDaysAgo > 2) {
      nudges.push('Welcome back! Ready to continue your learning journey?');
      nudges.push("It's been a while! Let's get back on track together.");
    }

    if (context.quizzesCompletedThisWeek && context.quizzesCompletedThisWeek > 0) {
      if (context.quizzesCompletedThisWeek >= 5) {
        nudges.push(
          `Outstanding! You've completed ${context.quizzesCompletedThisWeek} quizzes this week! 🌟`
        );
      } else {
        nudges.push(
          `Great work! You've completed ${context.quizzesCompletedThisWeek} quiz${context.quizzesCompletedThisWeek > 1 ? 'zes' : ''} this week!`
        );
      }
    } else {
      nudges.push('Ready to test your knowledge? Try a quiz today!');
    }

    // General motivational nudges (expanded list)
    const generalNudges = [
      "Every study session counts. You've got this!",
      'Small steps lead to big achievements!',
      "You're doing great! Keep up the momentum.",
      'Progress, not perfection. Keep learning!',
      'Your future self will thank you for studying today!',
      'Learning is a journey - enjoy every step!',
      "You're building great habits. Keep it up!",
      'Remember: every expert was once a beginner.',
      'Take a break if needed, then come back stronger!',
      "You're capable of amazing things. Believe in yourself!",
    ];

    // Shuffle and add general nudges until we reach maxNudges
    const shuffled = generalNudges.sort(() => Math.random() - 0.5);
    while (nudges.length < maxNudges && shuffled.length > 0) {
      const nudge = shuffled.shift()!;
      if (!nudges.includes(nudge)) {
        nudges.push(nudge);
      }
    }

    return nudges.slice(0, maxNudges);
  }

  // ============ Reflection Prompts ============

  /**
   * Get reflection prompts for post-session (AI-generated or template-based)
   */
  static async getReflectionPrompts(sessionContext?: {
    subject?: string;
    duration?: number;
    quizCompleted?: boolean;
    score?: number;
  }): Promise<string[]> {
    // Try AI-generated prompts first
    if (GeminiService.isAvailable()) {
      try {
        const aiPrompts = await GeminiService.generateReflectionPrompts(sessionContext);
        if (aiPrompts && aiPrompts.length > 0) {
          return aiPrompts;
        }
      } catch (error) {
        console.error(
          '[BehavioralService] AI reflection prompt generation failed, using templates:',
          error
        );
      }
    }

    // Fallback to template-based prompts
    return this.getTemplateReflectionPrompts(sessionContext);
  }

  /**
   * Template-based reflection prompts (fallback when AI unavailable)
   */
  private static getTemplateReflectionPrompts(sessionContext?: {
    subject?: string;
    duration?: number;
    quizCompleted?: boolean;
    score?: number;
  }): string[] {
    const prompts: string[] = [
      "What effort did you put in today that you're proud of?",
      'What mistake or challenge helped you learn something new?',
    ];

    if (sessionContext?.quizCompleted) {
      if (sessionContext.score && sessionContext.score >= 80) {
        prompts.push('Your effort paid off! What strategy helped you succeed?');
      } else {
        prompts.push(
          'What did you learn from the questions you got wrong? What will you work toward next time?'
        );
      }
    } else {
      prompts.push("What skill are you working toward mastering? What's your next step?");
    }

    return prompts;
  }

  // ============ Legacy Methods (kept for backward compatibility) ============

  static async trackEvent(
    userId: string,
    data: { eventType: string; eventData?: any; page?: string; sessionId?: string }
  ) {
    return customEventRepository.createEvent({
      userId: new Types.ObjectId(userId) as any,
      eventType: data.eventType as any,
      eventData: data.eventData || {},
      page: data.page as any,
      sessionId: data.sessionId as any,
      timestamp: new Date() as any,
    });
  }

  static async getEventHistory(userId: string, eventType: string | undefined, limit: number) {
    return customEventRepository.getHistory(userId, eventType, limit);
  }

  static async getEventCounts(userId: string, days: number) {
    return customEventRepository.getCounts(userId, days);
  }

  static async getPageViews(userId: string, days: number) {
    return customEventRepository.getPageViews(userId, days);
  }

  // ============ Legacy Methods (Not in MVP - Stub implementations) ============
  // These are kept for backward compatibility but return minimal data

  static async getBehavioralInsights(userId: string, days: number) {
    // Return minimal insights based on progress summary
    const summary = await this.getWeeklyProgressSummary(userId);
    return [
      {
        type: 'progress',
        title: 'Weekly Progress',
        description: `You completed ${summary.sessions.completed} sessions and ${summary.quizzes.completed} quizzes this week.`,
      },
    ];
  }

  static async getStudyConsistency(userId: string, days: number) {
    const summary = await this.getWeeklyProgressSummary(userId);
    return {
      dailyPattern: [],
      weeklyPattern: [],
      currentStreak: 0,
      lastActive: new Date(),
    };
  }

  static async getRecommendations(userId: string, type: string | undefined, limit: number) {
    return [];
  }

  static async generateRecommendations(userId: string) {
    return [];
  }

  static async markRecommendationAsRead(id: string, userId: string) {
    throw new AppError('Recommendations not available in MVP', 501);
  }

  static async markRecommendationAsActioned(id: string, userId: string) {
    throw new AppError('Recommendations not available in MVP', 501);
  }

  static async getProgressReports(
    userId: string,
    period: 'weekly' | 'monthly' | undefined,
    limit: number
  ) {
    return [];
  }

  static async generateProgressReport(userId: string, period: 'weekly' | 'monthly') {
    throw new AppError(
      'Progress reports not available in MVP. Use weekly progress summary instead.',
      501
    );
  }

  static async getSentimentAnalysis(userId: string, days: number) {
    // Return minimal sentiment based on engagement
    const summary = await this.getWeeklyProgressSummary(userId);
    return {
      overall: summary.engagement.averageScore >= 70 ? 'positive' : 'neutral',
      moodScore: summary.engagement.averageScore,
      engagementScore: summary.engagement.averageScore,
      dataPoints: {
        engagementRecords: summary.engagement.totalTime,
      },
      source: 'rule-based' as const,
    };
  }
}

export default BehavioralService;
