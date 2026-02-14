import { Types } from 'mongoose';
import quizRepository from '../repositories/QuizRepository';
import quizAttemptRepository from '../repositories/QuizAttemptRepository';
import userRepository from '../repositories/UserRepository';
import userProgressRepository from '../repositories/UserProgressRepository';
import badgeRepository from '../repositories/BadgeRepository';
import userBadgeRepository from '../repositories/UserBadgeRepository';
import goalRepository from '../repositories/GoalRepository';
import sessionRepository from '../repositories/SessionRepository';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export class GamificationService {
  /**
   * Normalize subject name from alias to canonical form
   * e.g., "Math" -> "Mathematics", "CS" -> "Computer Science"
   */
  private static normalizeSubject(subject: string): string {
    const subjectMap: Record<string, string> = {
      'Math': 'Mathematics',
      'math': 'Mathematics',
      'MATH': 'Mathematics',
      'CS': 'Computer Science',
      'cs': 'Computer Science',
      'Chem': 'Chemistry',
      'Bio': 'Biology',
      'Geo': 'Geography',
      'ENG': 'English',
      'SCI': 'Science',
    };
    return subjectMap[subject] || subject;
  }

  static async createQuiz(data: {
    title: string;
    subject: string;
    description: string;
    difficulty: string;
    timeLimit?: number;
    passingScore: number;
    points: number;
    isActive?: boolean;
    questions: Array<{
      type: string;
      question: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      points: number;
      order: number;
    }>;
  }) {
    // Normalize subject name (e.g., "Math" -> "Mathematics") before saving
    const normalizedSubject = GamificationService.normalizeSubject(data.subject);
    
    const quiz: any = await quizRepository.create({
      title: data.title,
      subject: normalizedSubject,
      description: data.description,
      difficulty: data.difficulty,
      timeLimit: data.timeLimit,
      passingScore: data.passingScore,
      points: data.points,
      isActive: data.isActive !== undefined ? data.isActive : true,
      questions: data.questions.map((q, index) => ({
        type: q.type || 'multiple_choice',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        points: q.points || 1,
        order: q.order || index + 1,
      })),
    } as any);

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      description: quiz.description,
      timeLimit: quiz.timeLimit || 0,
      questionCount: quiz.questions.length,
      totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.points, 0),
      passingScore: quiz.passingScore,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
    };
  }

  static async getQuizzes(filters: {
    subject?: string;
    difficulty?: string;
    page?: number;
    limit?: number;
    skip?: number;
  }) {
    const filter: any = {};
    
    // Handle subject filtering with aliases (e.g., "Math" -> "Mathematics")
    if (filters.subject) {
      const subjectAliases: Record<string, string[]> = {
        'Mathematics': ['Mathematics', 'Math', 'math', 'MATH'],
        'English': ['English', 'english', 'ENG'],
        'Science': ['Science', 'science', 'SCI'],
        'Physics': ['Physics', 'physics'],
        'Chemistry': ['Chemistry', 'chemistry', 'Chem'],
        'Biology': ['Biology', 'biology', 'Bio'],
        'History': ['History', 'history'],
        'Geography': ['Geography', 'geography', 'Geo'],
        'Computer Science': ['Computer Science', 'CS', 'cs', 'computer science'],
        'Art': ['Art', 'art'],
        'Music': ['Music', 'music'],
        'Spanish': ['Spanish', 'spanish'],
        'French': ['French', 'french'],
        'German': ['German', 'german'],
      };
      
      // Find the canonical subject name or use the provided subject
      let canonicalSubject = filters.subject;
      for (const [canonical, aliases] of Object.entries(subjectAliases)) {
        if (aliases.includes(filters.subject)) {
          canonicalSubject = canonical;
          break;
        }
      }
      
      // If we found a canonical subject, search for all its aliases
      // Otherwise, do a case-insensitive search for the provided subject
      if (subjectAliases[canonicalSubject]) {
        filter.subject = { $in: subjectAliases[canonicalSubject] };
      } else {
        // Case-insensitive search for exact match
        filter.subject = { $regex: new RegExp(`^${filters.subject}$`, 'i') };
      }
    }
    
    if (filters.difficulty) filter.difficulty = filters.difficulty;

    // Get total count
    const total = await (quizRepository as any).model.countDocuments({ ...filter, isActive: true });

    // Get paginated quizzes
    let query = (quizRepository as any).model.find({ ...filter, isActive: true });
    if (filters.skip !== undefined) query = query.skip(filters.skip);
    if (filters.limit !== undefined) query = query.limit(filters.limit);
    const quizzes = await query.sort({ createdAt: -1 });

    const transformedQuizzes = quizzes.map((quiz: any) => ({
      id: quiz._id.toString(),
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      description: quiz.description,
      timeLimit: quiz.timeLimit || 0,
      questionCount: quiz.questions.length,
      totalPoints: quiz.questions.reduce((sum: number, q: any) => sum + q.points, 0),
      passingScore: quiz.passingScore,
      isActive: quiz.isActive,
      createdAt: quiz.createdAt,
    }));

    return {
      quizzes: transformedQuizzes,
      total,
    };
  }

  static async getQuizById(id: string) {
    const quiz: any = await quizRepository.findActiveById(id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    return {
      id: quiz._id.toString(),
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      description: quiz.description,
      timeLimit: quiz.timeLimit || 0,
      passingScore: quiz.passingScore,
      questions: quiz.questions.map((q: any) => ({
        id: q._id.toString(),
        type: q.type,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || '',
        points: q.points,
        order: q.order,
      })),
    };
  }

  static async submitQuizAttempt(
    userId: string,
    payload: { quizId: string; answers: Record<string, string>; timeSpent: number }
  ) {
    const quiz: any = await quizRepository.findActiveById(payload.quizId);
    if (!quiz) throw new AppError('Quiz not found', 404);

    let totalPoints = 0;
    let earnedPoints = 0;

    console.log('[GamificationService] Submitting quiz attempt:', {
      quizId: payload.quizId,
      answersCount: Object.keys(payload.answers).length,
      answers: payload.answers,
      questionsCount: quiz.questions?.length || 0,
    });

    quiz.questions.forEach((question: any) => {
      const questionId = question._id.toString();
      totalPoints += question.points || 0;

      // Try multiple key formats to match the answer
      const userAnswer =
        payload.answers[questionId] ||
        payload.answers[question._id] ||
        payload.answers[String(question._id)];

      logger.debug('Processing quiz question', {
        questionId,
        points: question.points,
      });

      if (userAnswer) {
        const userAnswerNormalized = String(userAnswer).toLowerCase().trim();
        const correctAnswerNormalized = String(question.correctAnswer || '')
          .toLowerCase()
          .trim();
        const isCorrect = userAnswerNormalized === correctAnswerNormalized;

        logger.debug('Answer comparison', { questionId, isCorrect });

        if (isCorrect) {
          earnedPoints += question.points || 0;
        }
      } else {
        logger.warn('No answer found for question', { questionId });
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    logger.debug('Quiz attempt results', {
      totalPoints,
      earnedPoints,
      percentage,
      quizId: payload.quizId,
    });

    const attempt = await quizAttemptRepository.create({
      quizId: new Types.ObjectId(payload.quizId) as any,
      studentId: new Types.ObjectId(userId) as any,
      score: earnedPoints as any,
      totalPoints: totalPoints as any,
      percentage: percentage as any,
      completedAt: new Date() as any,
      timeSpent: payload.timeSpent as any,
      answers: payload.answers as any,
    } as any);

    const user = await userRepository.findById(userId);
    if (user) {
      (user as any).totalPoints += earnedPoints;
      await (user as any).save();
    }

    let userProgress: any = await userProgressRepository.findByUserAndSubject(userId, quiz.subject);
    if (!userProgress) {
      userProgress = await userProgressRepository.create({
        userId: new Types.ObjectId(userId) as any,
        subject: quiz.subject as any,
        level: 1 as any,
        currentXP: 0 as any,
        nextLevelXP: 100 as any,
        completedQuizzes: 0 as any,
        averageScore: 0 as any,
        studyTime: 0 as any,
        lastActivity: new Date() as any,
      } as any);
    }

    await (userProgress as any).addXP(earnedPoints);
    const previousTotal =
      (userProgress as any).averageScore * (userProgress as any).completedQuizzes;
    (userProgress as any).completedQuizzes += 1;
    (userProgress as any).averageScore = Math.round(
      (previousTotal + percentage) / (userProgress as any).completedQuizzes
    );
    (userProgress as any).studyTime += Math.floor(payload.timeSpent / 60);
    await (userProgress as any).save();

    // After recording this quiz attempt, automatically update all active goals
    try {
      // Recalculate the unified "current" progress value based on all quizzes + completed sessions
      const [quizzes, sessions] = await Promise.all([
        quizAttemptRepository.find({ studentId: new Types.ObjectId(userId) } as any),
        sessionRepository.find(
          { studentId: new Types.ObjectId(userId), status: 'completed' } as any
        ),
      ]);

      const currentCount = (quizzes as any[]).length + (sessions as any[]).length;

      // Update progress for all active goals for this user
      const goals = await goalRepository.findByUser(userId, true);
      await Promise.all(
        (goals as any[]).map((goal: any) =>
          goalRepository.updateProgress(goal._id.toString(), currentCount)
        )
      );

      logger.debug('[GamificationService.submitQuizAttempt] Goal progress auto-updated', {
        userId,
        goalsUpdated: (goals as any[]).length,
        currentCount,
      });
    } catch (error) {
      // Log but do not block quiz completion if goal update fails
      logger.error(
        '[GamificationService.submitQuizAttempt] Failed to auto-update goal progress',
        error,
        { userId }
      );
    }

    const newBadges = await this.checkBadgeEligibility(userId, percentage, quiz.subject);

    return {
      attempt,
      newBadges,
      pointsEarned: earnedPoints,
    };
  }

  static async getRecentAttempts(userId: string, limit: number, skip?: number) {
    // Get total count
    const total = await (quizAttemptRepository as any).model.countDocuments({
      studentId: new Types.ObjectId(userId),
    });

    // Get paginated attempts
    let query = (quizAttemptRepository as any).model
      .find({ studentId: new Types.ObjectId(userId) })
      .sort({ completedAt: -1 })
      .populate('quizId', 'title subject');
    if (skip !== undefined) query = query.skip(skip);
    query = query.limit(limit);
    const attempts: any[] = await query;

    logger.debug('Getting recent quiz attempts', {
      userId,
      count: attempts.length,
    });

    const transformedAttempts = attempts.map((attempt) => {
      const transformed = {
        id: attempt._id?.toString() || '',
        quizId: attempt.quizId?._id
          ? attempt.quizId._id.toString()
          : attempt.quizId?.toString() || '',
        score: Number(attempt.score) || 0,
        totalPoints: Number(attempt.totalPoints) || 0,
        percentage: Number(attempt.percentage) || 0,
        completedAt: attempt.completedAt,
        timeSpent: Number(attempt.timeSpent) || 0,
      };

      logger.debug('Transformed quiz attempt', { attemptId: transformed.id });
      return transformed;
    });

    return {
      attempts: transformedAttempts,
      total,
    };
  }

  // Get quiz attempts for parent's children
  static async getChildrenQuizAttempts(
    parentId: string,
    studentId?: string,
    page?: number,
    limit?: number,
    skip?: number
  ) {
    const User = (await import('../models/User')).User;

    // Get all children of the parent
    const children = await User.find({ parentId: new Types.ObjectId(parentId) });
    if (children.length === 0) {
      return { attempts: [], total: 0 };
    }

    const childrenIds = studentId
      ? [new Types.ObjectId(studentId)]
      : children.map((child) => child._id);

    // Get total count
    const total = await (quizAttemptRepository as any).model.countDocuments({
      studentId: { $in: childrenIds },
    });

    // Get paginated quiz attempts for all children
    let query = (quizAttemptRepository as any).model
      .find({ studentId: { $in: childrenIds } })
      .sort({ completedAt: -1 })
      .populate('quizId', 'title subject')
      .populate('studentId', 'firstName lastName');
    if (skip !== undefined) query = query.skip(skip);
    if (limit !== undefined) query = query.limit(limit);
    const attempts: any[] = await query;

    const transformedAttempts = attempts.map((attempt) => ({
      id: attempt._id.toString(),
      quizId: attempt.quizId._id.toString(),
      quizTitle: attempt.quizId?.title || 'Unknown Quiz',
      subject: attempt.quizId?.subject || 'Unknown',
      studentId: attempt.studentId._id.toString(),
      studentName:
        `${(attempt.studentId as any).firstName || ''} ${(attempt.studentId as any).lastName || ''}`.trim() ||
        'Unknown Student',
      score: attempt.score,
      totalPoints: attempt.totalPoints,
      percentage: attempt.percentage,
      completedAt: attempt.completedAt,
      timeSpent: attempt.timeSpent,
    }));

    return {
      attempts: transformedAttempts,
      total,
    };
  }

  static async getUserProfile(userId: string) {
    const user = await userRepository.findByIdWithFields(
      userId,
      'totalPoints streakCount lastLoginAt firstName lastName profileImage'
    );
    if (!user) throw new AppError('User not found', 404);

    const userBadges = await userBadgeRepository.findForUser(userId);

    const level = Math.floor(((user as any).totalPoints || 0) / 100) + 1;
    const currentXP = ((user as any).totalPoints || 0) % 100;
    const nextLevelXP = 100;

    const lastLogin = (user as any).lastLoginAt;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentStreak = (user as any).streakCount || 0;
    let isActive = false;
    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      lastLoginDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff === 0) isActive = true;
      else if (daysDiff > 1) currentStreak = 0;
    }

    const badges = (userBadges as any[]).map((ub: any) => {
      const badge = ub.badgeId as any;
      return {
        id: ub._id.toString(),
        userId: ub.userId.toString(),
        badgeId: badge._id.toString(),
        badge: {
          id: badge._id.toString(),
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          criteria: badge.criteria,
          pointsReward: badge.pointsReward,
          createdAt: badge.createdAt,
          isActive: badge.isActive,
        },
        earnedAt: ub.earnedAt,
      };
    });

    const usersAbove = await (userRepository as any).model.countDocuments({
      totalPoints: { $gt: (user as any).totalPoints },
    });
    const rank = usersAbove + 1;

    return {
      userId,
      level,
      currentXP,
      nextLevelXP,
      totalPoints: (user as any).totalPoints,
      streak: { currentStreak, longestStreak: (user as any).streakCount || 0, isActive },
      badges,
      rank,
    };
  }

  static async getUserProgress(userId: string) {
    const progress = await userProgressRepository.findByUser(userId);
    return (progress as any[]).map((p: any) => ({
      id: p._id.toString(),
      userId: p.userId.toString(),
      subject: p.subject,
      level: p.level,
      currentXP: p.currentXP,
      nextLevelXP: p.nextLevelXP,
      completedQuizzes: p.completedQuizzes,
      averageScore: p.averageScore,
      studyTime: p.studyTime,
      lastActivity: p.lastActivity,
    }));
  }

  static async getAvailableBadges() {
    const badges = await badgeRepository.findActive();
    return (badges as any[]).map((badge: any) => ({
      id: badge._id.toString(),
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      criteria: badge.criteria,
      pointsReward: badge.pointsReward,
      createdAt: badge.createdAt,
      isActive: badge.isActive,
    }));
  }

  static async getLeaderboard(
    userId: string | undefined,
    limit: number,
    timeframe?: 'week' | 'month' | 'all'
  ) {
    // Calculate date filter based on timeframe
    let dateFilter: any = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    }
    // 'all' or undefined means no date filter

    // Get quiz attempts to calculate stats
    const quizAttemptRepository = (await import('../repositories/QuizAttemptRepository')).default;
    const UserBadge = (await import('../models/UserBadge')).UserBadge;

    // Get all students with their total points
    const allStudents = await (userRepository as any).model
      .find({ role: 'STUDENT' })
      .select('firstName lastName profileImage totalPoints streakCount _id role')
      .sort({ totalPoints: -1 })
      .limit(limit * 2); // Get more to filter by timeframe if needed

    // Build leaderboard with full stats
    const leaderboardPromises = allStudents.map(async (user: any, index: number) => {
      const studentId = user._id.toString();

      // Get quiz attempts for this user (with timeframe filter if needed)
      const attemptQuery: any = { studentId: new Types.ObjectId(studentId) };
      if (Object.keys(dateFilter).length > 0) {
        attemptQuery.completedAt = dateFilter.createdAt;
      }

      const attempts = await (quizAttemptRepository as any).model.find(attemptQuery);
      const totalQuizzes = attempts.length;
      const averageScore =
        totalQuizzes > 0
          ? Math.round(
              attempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) / totalQuizzes
            )
          : 0;

      // Get user badges
      const badges = await UserBadge.find({ userId: new Types.ObjectId(studentId) })
        .populate('badgeId')
        .limit(5);

      return {
        id: studentId,
        rank: index + 1,
        userId: studentId,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
        userRole: user.role || 'STUDENT',
        totalPoints: user.totalPoints || 0,
        totalQuizzes,
        averageScore,
        currentStreak: user.streakCount || 0,
        badges: badges.map((ub: any) => ({
          id: ub._id.toString(),
          userId: ub.userId.toString(),
          badgeId: ub.badgeId._id.toString(),
          badge: {
            id: ub.badgeId._id.toString(),
            name: ub.badgeId.name,
            icon: ub.badgeId.icon,
            rarity: ub.badgeId.rarity,
            pointsReward: ub.badgeId.pointsReward,
          },
          earnedAt: ub.earnedAt,
        })),
        profileImage: user.profileImage || null,
      };
    });

    const leaderboard = await Promise.all(leaderboardPromises);

    // Re-sort by totalPoints after calculating stats (in case timeframe filtering changed order)
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Limit to requested number
    const limitedLeaderboard = leaderboard.slice(0, limit);

    // Get current user's rank if provided
    let currentUserEntry: any = null;
    if (userId) {
      const user = await userRepository.findById(userId);
      if (user && user.role === 'STUDENT') {
        const userAttempts = await (quizAttemptRepository as any).model.find({
          studentId: new Types.ObjectId(userId),
          ...(Object.keys(dateFilter).length > 0 ? { completedAt: dateFilter.createdAt } : {}),
        });
        const userTotalQuizzes = userAttempts.length;
        const userAverageScore =
          userTotalQuizzes > 0
            ? Math.round(
                userAttempts.reduce((sum: number, a: any) => sum + (a.percentage || 0), 0) /
                  userTotalQuizzes
              )
            : 0;

        const userBadges = await UserBadge.find({ userId: new Types.ObjectId(userId) })
          .populate('badgeId')
          .limit(5);

        const usersAbove = await (userRepository as any).model.countDocuments({
          role: 'STUDENT',
          totalPoints: { $gt: (user as any).totalPoints || 0 },
        });

        currentUserEntry = {
          id: userId,
          rank: usersAbove + 1,
          userId,
          userName:
            `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'Unknown',
          userRole: (user as any).role || 'STUDENT',
          totalPoints: (user as any).totalPoints || 0,
          totalQuizzes: userTotalQuizzes,
          averageScore: userAverageScore,
          currentStreak: (user as any).streakCount || 0,
          badges: userBadges.map((ub: any) => ({
            id: ub._id.toString(),
            userId: ub.userId.toString(),
            badgeId: ub.badgeId._id.toString(),
            badge: {
              id: ub.badgeId._id.toString(),
              name: ub.badgeId.name,
              icon: ub.badgeId.icon,
              rarity: ub.badgeId.rarity,
              pointsReward: ub.badgeId.pointsReward,
            },
            earnedAt: ub.earnedAt,
          })),
          profileImage: (user as any).profileImage || null,
        };
      }
    }

    // Combine leaderboard with current user if not already in top list
    const result = [...limitedLeaderboard];
    if (currentUserEntry && !result.find((e) => e.userId === currentUserEntry.userId)) {
      result.push(currentUserEntry);
    }

    return result;
  }

  static async checkBadgeEligibility(userId: string, quizPercentage: number, subject: string) {
    const user: any = await userRepository.findById(userId);
    if (!user) return [];

    const allBadges: any[] = await (badgeRepository as any).model.find({ isActive: true });
    const userBadges: any[] = await (userBadgeRepository as any).model.find({
      userId: new Types.ObjectId(userId),
    });
    const earnedBadgeIds = userBadges.map((ub: any) => ub.badgeId.toString());

    const newBadges: any[] = [];
    for (const badge of allBadges) {
      if (earnedBadgeIds.includes(badge._id.toString())) continue;
      let eligible = false;
      switch (badge.criteria.type) {
        case 'quiz_score':
          if (quizPercentage >= badge.criteria.threshold) {
            if (!badge.criteria.subject || badge.criteria.subject === subject) eligible = true;
          }
          break;
        case 'quiz_count':
          {
            const count = await (quizAttemptRepository as any).model.countDocuments({
              studentId: new Types.ObjectId(userId),
            });
            if (count >= badge.criteria.threshold) eligible = true;
          }
          break;
        case 'streak':
          if ((user as any).streakCount >= badge.criteria.threshold) eligible = true;
          break;
        case 'points':
          if ((user as any).totalPoints >= badge.criteria.threshold) eligible = true;
          break;
        case 'perfect_score':
          if (quizPercentage === 100) eligible = true;
          break;
      }

      if (eligible) {
        const userBadge = await userBadgeRepository.create({
          userId: new Types.ObjectId(userId) as any,
          badgeId: new Types.ObjectId(badge._id) as any,
          earnedAt: new Date() as any,
        } as any);

        (user as any).totalPoints += badge.pointsReward;
        await (user as any).save();

        newBadges.push({
          id: userBadge._id.toString(),
          userId: (userBadge as any).userId.toString(),
          badgeId: badge._id.toString(),
          badge: {
            id: badge._id.toString(),
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            category: badge.category,
            rarity: badge.rarity,
            criteria: badge.criteria,
            pointsReward: badge.pointsReward,
            createdAt: badge.createdAt,
            isActive: badge.isActive,
          },
          earnedAt: (userBadge as any).earnedAt,
        });
      }
    }

    return newBadges;
  }
}

export default GamificationService;
