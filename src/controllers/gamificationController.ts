import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { GamificationService } from '../services/gamificationService';
import { sendNotificationToUser } from '../socket';
import { getIO } from '../socket';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class GamificationController {
  static createQuiz = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Only tutors and admins can create quizzes
    if (req.user!.role !== 'TUTOR' && req.user!.role !== 'ADMIN') {
      throw new AppError('Only tutors and admins can create quizzes', 403);
    }

    const quiz = await GamificationService.createQuiz(req.body);
    res.status(201).json({ quiz });
  });

  static getQuizzes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { subject, difficulty } = req.query as any;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    const result = await GamificationService.getQuizzes({ subject, difficulty, page, limit, skip });
    const paginationResult = createPaginationResult(result.quizzes, result.total, page, limit);

    res.json({
      success: true,
      data: {
        quizzes: paginationResult.data,
        pagination: paginationResult.pagination,
      },
    });
  });

  static getQuizById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const quiz = await GamificationService.getQuizById(id);
    res.json({ quiz });
  });

  static submitQuizAttempt = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { quizId, answers, timeSpent } = req.body;
    const userId = req.user!.id;
    const result = await GamificationService.submitQuizAttempt(userId, {
      quizId,
      answers,
      timeSpent,
    });

    // Send notifications for newly earned badges
    const io = getIO();
    if (io && result.newBadges && result.newBadges.length > 0) {
      for (const badge of result.newBadges) {
        await sendNotificationToUser(io, userId, {
          type: 'badge_earned',
          title: '🏆 Badge Earned!',
          message: `Congratulations! You earned the "${badge.badge.name}" badge!`,
          data: {
            badgeId: badge.badge.id,
            badgeName: badge.badge.name,
            badgeIcon: badge.badge.icon,
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        attempt: {
          id: (result.attempt as any)._id.toString(),
          quizId: (result.attempt as any).quizId.toString(),
          score: (result.attempt as any).score,
          totalPoints: (result.attempt as any).totalPoints,
          percentage: (result.attempt as any).percentage,
          completedAt: (result.attempt as any).completedAt,
          timeSpent: (result.attempt as any).timeSpent,
        },
        newBadges: result.newBadges,
        pointsEarned: result.pointsEarned,
      },
    });
  });

  static getRecentAttempts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);
    const result = await GamificationService.getRecentAttempts(userId, limit, skip);
    const paginationResult = createPaginationResult(result.attempts, result.total, page, limit);
    res.json({
      success: true,
      attempts: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  static getUserProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await GamificationService.getUserProfile(userId);
    res.json({ profile });
  });

  static getUserProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const progress = await GamificationService.getUserProgress(userId);
    res.json({
      success: true,
      data: progress,
    });
  });

  static getAvailableBadges = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const badges = await GamificationService.getAvailableBadges();
    res.json({ badges });
  });

  static getLeaderboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const timeframe = (req.query.timeframe as 'week' | 'month' | 'all') || 'all';
    const userId = req.user?.id;
    const data = await GamificationService.getLeaderboard(userId, limit, timeframe);
    res.json(data);
  });

  static getQuizAttempts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { studentId } = req.query;
    const { page, limit, skip } = getPaginationParams(req, 50, 200);

    if (userRole === 'PARENT') {
      // Parents can view their children's quiz attempts
      const result = await GamificationService.getChildrenQuizAttempts(
        userId,
        studentId as string,
        page,
        limit,
        skip
      );
      const paginationResult = createPaginationResult(result.attempts, result.total, page, limit);
      res.json({
        success: true,
        attempts: paginationResult.data,
        pagination: paginationResult.pagination,
      });
    } else if (userRole === 'STUDENT') {
      // Students can view their own attempts
      const result = await GamificationService.getRecentAttempts(userId, limit, skip);
      const paginationResult = createPaginationResult(result.attempts, result.total, page, limit);
      res.json({
        success: true,
        attempts: paginationResult.data,
        pagination: paginationResult.pagination,
      });
    } else {
      throw new AppError('Unauthorized', 403);
    }
  });

  // moved into service
}
