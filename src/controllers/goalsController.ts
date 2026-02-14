import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import goalRepository from '../repositories/GoalRepository';
import { Types } from 'mongoose';
import quizAttemptRepository from '../repositories/QuizAttemptRepository';
import sessionRepository from '../repositories/SessionRepository';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class GoalsController {
  // Get all goals for current user
  static getGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    // Get all goals first (repository doesn't support pagination directly)
    const allGoals = await goalRepository.findByUser(userId, true);
    const total = allGoals.length;

    // Apply pagination
    const paginatedGoals = allGoals.slice(skip, skip + limit);

    const transformed = (paginatedGoals as any[]).map((goal) => ({
      id: goal._id.toString(),
      title: goal.title,
      description: goal.description,
      target: goal.target,
      current: goal.current,
      deadline: goal.deadline,
      milestones: goal.milestones || [],
      achievedMilestones: goal.achievedMilestones || [],
      assignedBy: goal.assignedBy ? goal.assignedBy.toString() : null,
      assignedAt: goal.assignedAt,
      status: goal.status || 'active',
      tutorFeedback: goal.tutorFeedback,
      isActive: goal.isActive,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    }));

    const paginationResult = createPaginationResult(transformed, total, page, limit);
    res.json({
      success: true,
      goals: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Create a new goal
  static createGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { title, description, target, deadline, milestones } = req.body;

    if (!title || !target) {
      throw new AppError('Title and target are required', 400);
    }

    // Student-initiated goals need tutor approval
    const goal = await goalRepository.create({
      userId: new Types.ObjectId(userId) as any,
      title,
      description,
      target: parseInt(target),
      current: 0,
      deadline: deadline ? new Date(deadline) : undefined,
      milestones: milestones || [25, 50, 75, 100],
      achievedMilestones: [],
      status: 'pending_approval', // Student-initiated goals need approval
      isActive: true,
    } as any);

    res.status(201).json({
      success: true,
      goal: {
        id: (goal as any)._id.toString(),
        title: (goal as any).title,
        description: (goal as any).description,
        target: (goal as any).target,
        current: (goal as any).current,
        deadline: (goal as any).deadline,
        milestones: (goal as any).milestones,
        achievedMilestones: (goal as any).achievedMilestones,
      },
    });
  });

  // Update goal progress (auto-calculated)
  static updateProgress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { goalId } = req.params;

    const goal = await goalRepository.findById(goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    if ((goal as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    // Calculate current progress based on quizzes and sessions
    const [quizzes, sessions] = await Promise.all([
      quizAttemptRepository.find({ studentId: new Types.ObjectId(userId) } as any),
      sessionRepository.find({ studentId: new Types.ObjectId(userId), status: 'completed' } as any),
    ]);

    const current = (quizzes as any[]).length + (sessions as any[]).length;
    const updatedGoal = await goalRepository.updateProgress(goalId, current);

    res.json({
      success: true,
      goal: {
        id: (updatedGoal as any)._id.toString(),
        current: (updatedGoal as any).current,
        achievedMilestones: (updatedGoal as any).achievedMilestones,
      },
    });
  });

  // Get upcoming milestones for a goal
  static getMilestones = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { goalId } = req.params;

    const goal = await goalRepository.findById(goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    const progressPercent = ((goal as any).current / (goal as any).target) * 100;
    const milestones = (goal as any).milestones || [];
    const achievedMilestones = (goal as any).achievedMilestones || [];

    const upcoming = milestones
      .filter((m: number) => progressPercent < m && !achievedMilestones.includes(m))
      .sort((a: number, b: number) => a - b);

    res.json({
      success: true,
      milestones: {
        current: (goal as any).current,
        target: (goal as any).target,
        progressPercent: Math.round(progressPercent),
        upcoming,
        achieved: achievedMilestones,
      },
    });
  });

  // Delete a goal
  static deleteGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { goalId } = req.params;

    const goal = await goalRepository.findById(goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    if ((goal as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    await goalRepository.deleteById(goalId);

    res.json({ success: true, message: 'Goal deleted successfully' });
  });
}
