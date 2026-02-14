import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import weeklyCommitmentRepository from '../repositories/WeeklyCommitmentRepository';
import userRepository from '../repositories/UserRepository';
import { Types } from 'mongoose';
import { UserRole } from '../types';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import notificationService from '../services/notificationService';

export class TutorCommitmentsController {
  // Assign commitment to student
  static assignCommitment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { studentId } = req.params;
    const { commitments, weekStart } = req.body;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can assign commitments', 403);
    }

    if (!commitments || !Array.isArray(commitments) || commitments.length === 0) {
      throw new AppError('Commitments array is required', 400);
    }

    if (commitments.length > 5) {
      throw new AppError('Maximum 5 commitments per week', 400);
    }

    // Verify student exists
    const student = await userRepository.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if ((student as any).role !== UserRole.STUDENT) {
      throw new AppError('User is not a student', 400);
    }

    // Calculate week start and end
    let weekStartDate: Date;
    if (weekStart) {
      weekStartDate = new Date(weekStart);
      weekStartDate.setHours(0, 0, 0, 0);
      const day = weekStartDate.getDay();
      const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
      weekStartDate.setDate(diff);
    } else {
      const now = new Date();
      weekStartDate = new Date(now);
      weekStartDate.setHours(0, 0, 0, 0);
      const day = weekStartDate.getDay();
      const diff = weekStartDate.getDate() - day + (day === 0 ? -6 : 1);
      weekStartDate.setDate(diff);
    }

    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Create or update commitment with tutor assignment
    const WeeklyCommitment = (await import('../models/WeeklyCommitment')).WeeklyCommitment;
    const commitment = await WeeklyCommitment.findOne({
      userId: new Types.ObjectId(studentId),
      weekStart: weekStartDate,
    });

    if (commitment) {
      // Update existing commitment
      (commitment as any).commitments = commitments.map((c: any) => ({
        text: c.text,
        type: c.type || 'time',
        target: parseInt(c.target) || 0,
        completed: false,
      }));
      (commitment as any).assignedBy = new Types.ObjectId(tutorId);
      (commitment as any).assignedAt = new Date();
      await (commitment as any).save();
    } else {
      // Create new commitment
      const newCommitment = await weeklyCommitmentRepository.create({
        userId: new Types.ObjectId(studentId) as any,
        weekStart: weekStartDate,
        weekEnd,
        commitments: commitments.map((c: any) => ({
          text: c.text,
          type: c.type || 'time',
          target: parseInt(c.target) || 0,
          completed: false,
        })),
        assignedBy: new Types.ObjectId(tutorId) as any,
        assignedAt: new Date(),
      } as any);

      // Notify student
      const tutor = await userRepository.findById(tutorId);
      const tutorName = tutor
        ? `${(tutor as any).firstName} ${(tutor as any).lastName}`
        : 'Your tutor';
      await notificationService.notifyCommitmentAssigned(studentId, tutorName).catch(console.error);

      res.status(201).json({
        success: true,
        commitment: {
          id: (newCommitment as any)._id.toString(),
          studentId,
          weekStart: (newCommitment as any).weekStart,
          weekEnd: (newCommitment as any).weekEnd,
          commitments: (newCommitment as any).commitments,
          assignedBy: tutorId,
          assignedAt: (newCommitment as any).assignedAt,
        },
      });
      return;
    }

    // Notify student (for updated commitment)
    const tutor = await userRepository.findById(tutorId);
    const tutorName = tutor
      ? `${(tutor as any).firstName} ${(tutor as any).lastName}`
      : 'Your tutor';
    await notificationService.notifyCommitmentAssigned(studentId, tutorName).catch(console.error);

    res.json({
      success: true,
      commitment: {
        id: (commitment as any)._id.toString(),
        studentId,
        weekStart: (commitment as any).weekStart,
        weekEnd: (commitment as any).weekEnd,
        commitments: (commitment as any).commitments,
        assignedBy: tutorId,
        assignedAt: (commitment as any).assignedAt,
      },
    });
  });

  // Get all commitments assigned by this tutor
  static getAssignedCommitments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can view assigned commitments', 403);
    }

    const allCommitments = await weeklyCommitmentRepository.find({
      assignedBy: new Types.ObjectId(tutorId),
    } as any);

    const total = allCommitments.length;
    const paginatedCommitments = (allCommitments as any[]).slice(skip, skip + limit);

    // Get student names for each commitment
    const commitmentsWithStudents = await Promise.all(
      paginatedCommitments.map(async (commitment: any) => {
        const student = await userRepository.findById(commitment.userId.toString());
        const studentName = student
          ? `${(student as any).firstName} ${(student as any).lastName}`
          : 'Unknown Student';

        const commitments = commitment.commitments || [];
        const completed = commitments.filter((c: any) => c.completed).length;
        const completionRate =
          commitments.length > 0 ? Math.round((completed / commitments.length) * 100) : 0;

        return {
          id: commitment._id.toString(),
          studentId: commitment.userId.toString(),
          studentName,
          weekStart: commitment.weekStart,
          weekEnd: commitment.weekEnd,
          commitments: commitments.map((c: any) => ({
            text: c.text,
            type: c.type,
            target: c.target,
            completed: c.completed,
            completedAt: c.completedAt,
          })),
          completionRate,
          assignedAt: commitment.assignedAt,
        };
      })
    );

    const paginationResult = createPaginationResult(commitmentsWithStudents, total, page, limit);
    res.json({
      success: true,
      commitments: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });
}
