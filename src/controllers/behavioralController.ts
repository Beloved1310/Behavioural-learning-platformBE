import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  MoodLog,
  CustomEvent,
  Recommendation,
  BehavioralData,
  Session,
  QuizAttempt,
  User,
  ProgressReport
} from '../models';
import { AppError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

export class BehavioralController {
  // ============ Mood Tracking Endpoints ============

  // Log a mood entry
  static async logMood(req: AuthenticatedRequest, res: Response) {
    try {
      const { mood, intensity, context, tags, notes } = req.body;
      const userId = req.user!.id;

      const moodLog = await MoodLog.create({
        userId,
        mood,
        intensity,
        context,
        tags: tags || [],
        notes,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        moodLog: {
          id: moodLog._id.toString(),
          userId: moodLog.userId.toString(),
          mood: moodLog.mood,
          intensity: moodLog.intensity,
          context: moodLog.context,
          tags: moodLog.tags,
          notes: moodLog.notes,
          timestamp: moodLog.timestamp
        }
      });
    } catch (error) {
      throw new AppError('Failed to log mood', 500);
    }
  }

  // Get mood history
  static async getMoodHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 50;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const moodLogs = await MoodLog.find({
        userId,
        timestamp: { $gte: startDate }
      })
        .sort({ timestamp: -1 })
        .limit(limit);

      const transformedLogs = moodLogs.map(log => ({
        id: log._id.toString(),
        mood: log.mood,
        intensity: log.intensity,
        context: log.context,
        tags: log.tags,
        notes: log.notes,
        timestamp: log.timestamp
      }));

      res.json({
        success: true,
        moodLogs: transformedLogs,
        count: transformedLogs.length
      });
    } catch (error) {
      throw new AppError('Failed to fetch mood history', 500);
    }
  }

  // Get mood distribution
  static async getMoodDistribution(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const distribution = await (MoodLog as any).getMoodDistribution(userId, days);

      res.json({
        success: true,
        distribution,
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch mood distribution', 500);
    }
  }

  // Get mood trends
  static async getMoodTrends(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const trends = await (MoodLog as any).getMoodTrends(userId, days);

      res.json({
        success: true,
        trends,
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch mood trends', 500);
    }
  }

  // ============ Custom Event Tracking Endpoints ============

  // Track a custom event
  static async trackEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventType, eventData, page, sessionId } = req.body;
      const userId = req.user!.id;

      const event = await CustomEvent.create({
        userId,
        eventType,
        eventData: eventData || {},
        page,
        sessionId,
        timestamp: new Date()
      });

      res.status(201).json({
        success: true,
        event: {
          id: event._id.toString(),
          eventType: event.eventType,
          timestamp: event.timestamp
        }
      });
    } catch (error) {
      throw new AppError('Failed to track event', 500);
    }
  }

  // Get event history
  static async getEventHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const eventType = req.query.eventType as string;
      const limit = parseInt(req.query.limit as string) || 50;

      let query: any = { userId };
      if (eventType) {
        query.eventType = eventType;
      }

      const events = await CustomEvent.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);

      const transformedEvents = events.map(event => ({
        id: event._id.toString(),
        eventType: event.eventType,
        eventData: event.eventData,
        page: event.page,
        timestamp: event.timestamp
      }));

      res.json({
        success: true,
        events: transformedEvents,
        count: transformedEvents.length
      });
    } catch (error) {
      throw new AppError('Failed to fetch event history', 500);
    }
  }

  // Get event counts
  static async getEventCounts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const counts = await (CustomEvent as any).getEventCounts(userId, days);

      res.json({
        success: true,
        eventCounts: counts,
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch event counts', 500);
    }
  }

  // Get page views
  static async getPageViews(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const pageViews = await (CustomEvent as any).getPageViews(userId, days);

      res.json({
        success: true,
        pageViews,
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch page views', 500);
    }
  }

  // ============ Behavioral Insights Endpoints ============

  // Get comprehensive behavioral insights
  static async getBehavioralInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get various data points
      const [
        moodDistribution,
        recentMoods,
        sessionStats,
        quizStats,
        engagementData
      ] = await Promise.all([
        (MoodLog as any).getMoodDistribution(userId, days),
        MoodLog.find({ userId, timestamp: { $gte: startDate } }).sort({ timestamp: -1 }).limit(10),
        Session.aggregate([
          { $match: { studentId: new Types.ObjectId(userId), scheduledAt: { $gte: startDate } } },
          { $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            totalDuration: { $sum: '$duration' }
          }}
        ]),
        QuizAttempt.aggregate([
          { $match: { studentId: new Types.ObjectId(userId), completedAt: { $gte: startDate } } },
          { $group: {
            _id: null,
            totalQuizzes: { $sum: 1 },
            averageScore: { $avg: '$percentage' },
            totalTimeSpent: { $sum: '$timeSpent' }
          }}
        ]),
        BehavioralData.find({ userId, timestamp: { $gte: startDate } })
      ]);

      // Generate insights based on data
      const insights = [];

      // Mood insights
      if (moodDistribution.length > 0) {
        const dominantMood = moodDistribution[0];
        insights.push({
          type: 'mood',
          title: 'Mood Pattern',
          description: `Your most frequent mood in the past ${days} days has been "${dominantMood._id}"`,
          data: { mood: dominantMood._id, count: dominantMood.count }
        });
      }

      // Study consistency insights
      if (sessionStats.length > 0) {
        const stats = sessionStats[0];
        const completionRate = stats.totalSessions > 0
          ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
          : 0;

        insights.push({
          type: 'consistency',
          title: 'Study Consistency',
          description: `You've completed ${stats.completedSessions} out of ${stats.totalSessions} sessions (${completionRate}%)`,
          data: stats
        });
      }

      // Quiz performance insights
      if (quizStats.length > 0) {
        const stats = quizStats[0];
        insights.push({
          type: 'performance',
          title: 'Quiz Performance',
          description: `Average quiz score: ${Math.round(stats.averageScore)}% across ${stats.totalQuizzes} quizzes`,
          data: stats
        });
      }

      // Engagement insights
      if (engagementData.length > 0) {
        const avgEngagement = engagementData.reduce((sum, d) => sum + d.engagementScore, 0) / engagementData.length;
        insights.push({
          type: 'engagement',
          title: 'Engagement Level',
          description: `Your average engagement score is ${Math.round(avgEngagement)}%`,
          data: { averageEngagement: Math.round(avgEngagement), dataPoints: engagementData.length }
        });
      }

      res.json({
        success: true,
        insights,
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch behavioral insights', 500);
    }
  }

  // Get study consistency analysis
  static async getStudyConsistency(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get daily study pattern
      const dailyPattern = await Session.aggregate([
        {
          $match: {
            studentId: new Types.ObjectId(userId),
            scheduledAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
            sessionCount: { $sum: 1 },
            totalMinutes: { $sum: '$duration' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      // Calculate streak
      const user = await User.findById(userId).select('streakCount lastLoginAt');

      // Get weekly breakdown
      const weeklyPattern = await Session.aggregate([
        {
          $match: {
            studentId: new Types.ObjectId(userId),
            scheduledAt: { $gte: startDate },
            status: 'completed'
          }
        },
        {
          $group: {
            _id: { $dayOfWeek: '$scheduledAt' },
            sessionCount: { $sum: 1 },
            avgDuration: { $avg: '$duration' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      res.json({
        success: true,
        consistency: {
          dailyPattern,
          weeklyPattern,
          currentStreak: user?.streakCount || 0,
          lastActive: user?.lastLoginAt
        },
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch study consistency', 500);
    }
  }

  // ============ Recommendations Endpoints ============

  // Get personalized recommendations
  static async getRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;

      let query: any = {
        userId: new Types.ObjectId(userId),
        $or: [
          { expiresAt: { $gte: new Date() } },
          { expiresAt: { $exists: false } }
        ]
      };

      if (type) {
        query.type = type;
      }

      const recommendations = await Recommendation.find(query)
        .sort({ priority: -1, generatedAt: -1 })
        .limit(limit);

      const transformedRecommendations = recommendations.map(rec => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        metadata: rec.metadata,
        isRead: rec.isRead,
        isActioned: rec.isActioned,
        generatedAt: rec.generatedAt
      }));

      res.json({
        success: true,
        recommendations: transformedRecommendations,
        count: transformedRecommendations.length
      });
    } catch (error) {
      throw new AppError('Failed to fetch recommendations', 500);
    }
  }

  // Generate new recommendations based on behavior
  static async generateRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Analyze user behavior
      const [moodData, sessionData, quizData] = await Promise.all([
        MoodLog.find({ userId, timestamp: { $gte: startDate } }),
        Session.find({ studentId: userId, scheduledAt: { $gte: startDate } }),
        QuizAttempt.find({ studentId: userId, completedAt: { $gte: startDate } })
      ]);

      const newRecommendations = [];

      // Generate recommendations based on mood patterns
      const negativeMoods = moodData.filter(m => ['frustrated', 'confused', 'sad', 'anxious'].includes(m.mood));
      if (negativeMoods.length > moodData.length * 0.5) {
        const rec = await Recommendation.create({
          userId,
          type: 'break',
          title: 'Consider Taking Breaks',
          description: 'We noticed you\'ve been feeling stressed. Try taking short breaks during study sessions.',
          priority: 4,
          metadata: { reason: 'high_negative_mood_frequency' },
          generatedAt: new Date()
        });
        newRecommendations.push(rec);
      }

      // Generate recommendations based on study consistency
      const completedSessions = sessionData.filter(s => s.status === 'completed');
      if (completedSessions.length < 5) {
        const rec = await Recommendation.create({
          userId,
          type: 'study_time',
          title: 'Increase Study Sessions',
          description: 'Try to schedule more regular study sessions to build consistency.',
          priority: 3,
          metadata: { current_sessions: completedSessions.length, target: 10 },
          generatedAt: new Date()
        });
        newRecommendations.push(rec);
      }

      // Generate recommendations based on quiz performance
      if (quizData.length > 0) {
        const avgScore = quizData.reduce((sum, q) => sum + q.percentage, 0) / quizData.length;
        if (avgScore < 70) {
          const rec = await Recommendation.create({
            userId,
            type: 'technique',
            title: 'Try Active Recall',
            description: 'Your quiz scores suggest you might benefit from active recall techniques.',
            priority: 5,
            metadata: { current_avg: Math.round(avgScore), target: 80 },
            generatedAt: new Date()
          });
          newRecommendations.push(rec);
        }
      }

      const transformedRecommendations = newRecommendations.map(rec => ({
        id: rec._id.toString(),
        type: rec.type,
        title: rec.title,
        description: rec.description,
        priority: rec.priority,
        metadata: rec.metadata,
        generatedAt: rec.generatedAt
      }));

      res.status(201).json({
        success: true,
        recommendations: transformedRecommendations,
        count: transformedRecommendations.length
      });
    } catch (error) {
      throw new AppError('Failed to generate recommendations', 500);
    }
  }

  // Mark recommendation as read
  static async markRecommendationAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const recommendation = await Recommendation.findOne({ _id: id, userId });

      if (!recommendation) {
        throw new AppError('Recommendation not found', 404);
      }

      recommendation.isRead = true;
      await recommendation.save();

      res.json({
        success: true,
        message: 'Recommendation marked as read'
      });
    } catch (error) {
      throw error;
    }
  }

  // Mark recommendation as actioned
  static async markRecommendationAsActioned(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const recommendation = await Recommendation.findOne({ _id: id, userId });

      if (!recommendation) {
        throw new AppError('Recommendation not found', 404);
      }

      recommendation.isActioned = true;
      await recommendation.save();

      res.json({
        success: true,
        message: 'Recommendation marked as actioned'
      });
    } catch (error) {
      throw error;
    }
  }

  // ============ Progress Reports Endpoints ============

  // Get progress reports
  static async getProgressReports(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const period = req.query.period as 'weekly' | 'monthly' || 'weekly';
      const limit = parseInt(req.query.limit as string) || 10;

      let query: any = { studentId: userId };
      if (period) {
        query.period = period;
      }

      const reports = await ProgressReport.find(query)
        .sort({ generatedAt: -1 })
        .limit(limit);

      const transformedReports = reports.map(report => ({
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
        generatedAt: report.generatedAt
      }));

      res.json({
        success: true,
        reports: transformedReports,
        count: transformedReports.length
      });
    } catch (error) {
      throw new AppError('Failed to fetch progress reports', 500);
    }
  }

  // Generate new progress report
  static async generateProgressReport(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { period } = req.body; // 'weekly' or 'monthly'

      const endDate = new Date();
      const startDate = new Date();

      if (period === 'weekly') {
        startDate.setDate(startDate.getDate() - 7);
      } else {
        startDate.setMonth(startDate.getMonth() - 1);
      }

      // Gather data for the period
      const [sessions, quizzes, user, badges] = await Promise.all([
        Session.find({
          studentId: userId,
          scheduledAt: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }),
        QuizAttempt.find({
          studentId: userId,
          completedAt: { $gte: startDate, $lte: endDate }
        }),
        User.findById(userId).select('streakCount totalPoints'),
        // Get badges earned in this period
        (async () => {
          const UserBadge = (await import('../models')).UserBadge;
          return UserBadge.find({
            userId,
            earnedAt: { $gte: startDate, $lte: endDate }
          });
        })()
      ]);

      // Calculate metrics
      const totalStudyTime = sessions.reduce((sum, s) => sum + s.duration, 0);
      const averageScore = quizzes.length > 0
        ? Math.round(quizzes.reduce((sum, q) => sum + q.percentage, 0) / quizzes.length)
        : 0;

      // Generate insights
      const insights = [];
      if (sessions.length > 0) {
        insights.push(`You completed ${sessions.length} study sessions this ${period}`);
      }
      if (quizzes.length > 0) {
        insights.push(`You took ${quizzes.length} quizzes with an average score of ${averageScore}%`);
      }
      if (totalStudyTime > 0) {
        insights.push(`Total study time: ${totalStudyTime} minutes`);
      }

      // Generate recommendations
      const recommendations = [];
      if (averageScore < 70) {
        recommendations.push('Consider reviewing material more thoroughly before taking quizzes');
      }
      if (sessions.length < 5) {
        recommendations.push('Try to increase your study frequency for better consistency');
      }

      // Create report
      const report = await ProgressReport.create({
        studentId: userId,
        period,
        startDate,
        endDate,
        totalStudyTime,
        sessionsCompleted: sessions.length,
        quizzesTaken: quizzes.length,
        averageScore,
        streakDays: user?.streakCount || 0,
        badgesEarned: badges.length,
        pointsEarned: 0, // Could track this separately
        insights,
        recommendations,
        generatedAt: new Date()
      });

      res.status(201).json({
        success: true,
        report: {
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
          generatedAt: report.generatedAt
        }
      });
    } catch (error) {
      throw new AppError('Failed to generate progress report', 500);
    }
  }

  // ============ Sentiment Analysis Endpoints ============

  // Get sentiment analysis from mood and engagement data
  static async getSentimentAnalysis(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const days = parseInt(req.query.days as string) || 30;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [moodData, engagementData] = await Promise.all([
        MoodLog.find({ userId, timestamp: { $gte: startDate } }),
        BehavioralData.find({ userId, timestamp: { $gte: startDate } })
      ]);

      // Calculate sentiment scores
      const moodScores: Record<string, number> = {
        happy: 5,
        excited: 5,
        confident: 4,
        calm: 4,
        neutral: 3,
        confused: 2,
        frustrated: 2,
        anxious: 1,
        sad: 1,
        angry: 1
      };

      const avgMoodScore = moodData.length > 0
        ? moodData.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / moodData.length
        : 3;

      const avgEngagement = engagementData.length > 0
        ? engagementData.reduce((sum, d) => sum + d.engagementScore, 0) / engagementData.length
        : 0;

      // Overall sentiment
      let sentiment = 'neutral';
      if (avgMoodScore >= 4 && avgEngagement >= 70) {
        sentiment = 'very_positive';
      } else if (avgMoodScore >= 3.5 && avgEngagement >= 60) {
        sentiment = 'positive';
      } else if (avgMoodScore < 2.5 || avgEngagement < 40) {
        sentiment = 'negative';
      }

      res.json({
        success: true,
        sentiment: {
          overall: sentiment,
          moodScore: Math.round(avgMoodScore * 20), // Convert to 0-100 scale
          engagementScore: Math.round(avgEngagement),
          dataPoints: {
            moodLogs: moodData.length,
            engagementRecords: engagementData.length
          }
        },
        period: `${days} days`
      });
    } catch (error) {
      throw new AppError('Failed to fetch sentiment analysis', 500);
    }
  }

  // ============ Motivational System Endpoints ============

  // Get motivational prompts based on behavior
  static async getMotivationalPrompts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const maxPrompts = parseInt(req.query.max as string) || 3;

      const user = await User.findById(userId).select('streakCount totalPoints');

      const prompts = [];

      // Streak-based prompts
      if (user && user.streakCount > 0) {
        prompts.push({
          type: 'streak',
          message: `Amazing! You're on a ${user.streakCount}-day streak! 🔥`,
          icon: '🔥',
          priority: 5
        });
      } else {
        prompts.push({
          type: 'streak',
          message: 'Start your learning streak today! 💪',
          icon: '💪',
          priority: 3
        });
      }

      // Points-based prompts
      if (user && user.totalPoints > 0) {
        const nextMilestone = Math.ceil(user.totalPoints / 100) * 100;
        const pointsToGo = nextMilestone - user.totalPoints;
        prompts.push({
          type: 'points',
          message: `Only ${pointsToGo} points until you reach ${nextMilestone}! 🎯`,
          icon: '🎯',
          priority: 4
        });
      }

      // General motivational prompts
      const generalPrompts = [
        { message: 'Every expert was once a beginner. Keep going! 🌟', icon: '🌟', priority: 2 },
        { message: 'You\'re making great progress! 🚀', icon: '🚀', priority: 2 },
        { message: 'Learning is a journey, not a destination! 🛤️', icon: '🛤️', priority: 2 }
      ];

      prompts.push(...generalPrompts);

      // Sort by priority and limit
      const selectedPrompts = prompts
        .sort((a, b) => b.priority - a.priority)
        .slice(0, maxPrompts)
        .map(({ message, icon }) => ({ message, icon }));

      res.json({
        success: true,
        prompts: selectedPrompts
      });
    } catch (error) {
      throw new AppError('Failed to fetch motivational prompts', 500);
    }
  }
}
