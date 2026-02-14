import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import weeklyCommitmentRepository from '../repositories/WeeklyCommitmentRepository';
import { Types } from 'mongoose';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';

export class CommitmentsController {
  // Get current week's commitments
  static getCurrentCommitments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const commitment = await weeklyCommitmentRepository.findCurrentWeek(userId);

    if (!commitment) {
      return res.json({
        success: true,
        commitment: null,
        completionRate: 0,
      });
    }

    const commitments = (commitment as any).commitments || [];
    const completed = commitments.filter((c: any) => c.completed).length;
    const completionRate =
      commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;

    res.json({
      success: true,
      commitment: {
        id: (commitment as any)._id.toString(),
        weekStart: (commitment as any).weekStart,
        weekEnd: (commitment as any).weekEnd,
        commitments: commitments.map((c: any) => ({
          text: c.text,
          type: c.type,
          target: c.target,
          completed: c.completed,
          completedAt: c.completedAt,
        })),
        assignedBy: (commitment as any).assignedBy
          ? (commitment as any).assignedBy.toString()
          : null,
      },
      completionRate,
    });
  });

  // Create weekly commitments
  static createCommitments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { commitments } = req.body;

    if (!commitments || !Array.isArray(commitments) || commitments.length === 0) {
      throw new AppError('Commitments array is required', 400);
    }

    if (commitments.length > 5) {
      throw new AppError('Maximum 5 commitments per week', 400);
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    const day = weekStart.getDay();
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    weekStart.setDate(diff);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Check if commitment already exists for this week
    const existing = await weeklyCommitmentRepository.findCurrentWeek(userId);
    if (existing) {
      throw new AppError('Commitments already set for this week', 400);
    }

    const commitment = await weeklyCommitmentRepository.create({
      userId: new Types.ObjectId(userId) as any,
      weekStart,
      weekEnd,
      commitments: commitments.map((c: any) => ({
        text: c.text,
        type: c.type || 'time',
        target: parseInt(c.target) || 0,
        completed: false,
      })),
    } as any);

    res.status(201).json({
      success: true,
      commitment: {
        id: (commitment as any)._id.toString(),
        weekStart: (commitment as any).weekStart,
        weekEnd: (commitment as any).weekEnd,
        commitments: (commitment as any).commitments,
      },
    });
  });

  // Toggle commitment completion
  static toggleCommitment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { commitmentId, itemIndex } = req.params;

    const commitment = await weeklyCommitmentRepository.findById(commitmentId);
    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    if ((commitment as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    const updated = await weeklyCommitmentRepository.toggleCommitment(
      commitmentId,
      parseInt(itemIndex)
    );

    const commitments = (updated as any).commitments || [];
    const completed = commitments.filter((c: any) => c.completed).length;
    const completionRate =
      commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;

    res.json({
      success: true,
      commitment: {
        id: (updated as any)._id.toString(),
        commitments: commitments.map((c: any) => ({
          text: c.text,
          type: c.type,
          target: c.target,
          completed: c.completed,
          completedAt: c.completedAt,
        })),
      },
      completionRate,
    });
  });

  // Get commitment history
  static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    const allCommitments = await weeklyCommitmentRepository.findByUser(userId);
    const total = allCommitments.length;
    const paginatedCommitments = (allCommitments as any[]).slice(skip, skip + limit);

    const history = paginatedCommitments.map((commitment: any) => {
      const commitments = commitment.commitments || [];
      const completed = commitments.filter((c: any) => c.completed).length;
      const completionRate =
        commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;

      return {
        id: commitment._id.toString(),
        weekStart: commitment.weekStart,
        weekEnd: commitment.weekEnd,
        completionRate,
        totalCommitments: commitments.length,
        completedCommitments: completed,
      };
    });

    const paginationResult = createPaginationResult(history, total, page, limit);
    res.json({
      success: true,
      history: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Delete a commitment
  static deleteCommitment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { commitmentId } = req.params;

    const commitment = await weeklyCommitmentRepository.findById(commitmentId);
    if (!commitment) {
      throw new AppError('Commitment not found', 404);
    }

    if ((commitment as any).userId.toString() !== userId) {
      throw new AppError('Access denied', 403);
    }

    await weeklyCommitmentRepository.deleteById(commitmentId);

    res.json({ success: true, message: 'Commitment deleted successfully' });
  });
}
