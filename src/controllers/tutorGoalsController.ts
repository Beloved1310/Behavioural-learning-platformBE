import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import goalRepository from '../repositories/GoalRepository';
import userRepository from '../repositories/UserRepository';
import { Types } from 'mongoose';
import { UserRole } from '../types';
import { Goal } from '../models/Goal';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import notificationService from '../services/notificationService';

export class TutorGoalsController {
  // Get all goals assigned by this tutor
  static getAssignedGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    const allGoals = await goalRepository.findByTutor(tutorId);
    const total = allGoals.length;
    const paginatedGoals = (allGoals as any[]).slice(skip, skip + limit);

    // Get student names for each goal
    const goalsWithStudents = await Promise.all(
      paginatedGoals.map(async (goal: any) => {
        const student = await userRepository.findById(goal.userId.toString());
        const studentName = student
          ? `${(student as any).firstName} ${(student as any).lastName}`
          : 'Unknown Student';

        const progressPercent = Math.round((goal.current / goal.target) * 100);

        return {
          id: goal._id.toString(),
          studentId: goal.userId.toString(),
          studentName,
          title: goal.title,
          description: goal.description,
          target: goal.target,
          current: goal.current,
          progressPercent,
          deadline: goal.deadline,
          milestones: goal.milestones || [],
          achievedMilestones: goal.achievedMilestones || [],
          assignedAt: goal.assignedAt,
          createdAt: goal.createdAt,
        };
      })
    );

    const paginationResult = createPaginationResult(goalsWithStudents, total, page, limit);
    res.json({
      success: true,
      goals: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Assign goal to student
  static assignGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { studentId } = req.params;
    const { title, description, target, deadline, milestones } = req.body;

    if (!title || !target) {
      throw new AppError('Title and target are required', 400);
    }

    // Verify student exists
    const student = await userRepository.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    if ((student as any).role !== UserRole.STUDENT) {
      throw new AppError('User is not a student', 400);
    }

    // Create goal with tutor assignment (tutor-assigned goals are automatically active)
    const goal = await goalRepository.create({
      userId: new Types.ObjectId(studentId) as any,
      title,
      description,
      target: parseInt(target),
      current: 0,
      deadline: deadline ? new Date(deadline) : undefined,
      milestones: milestones || [25, 50, 75, 100],
      achievedMilestones: [],
      assignedBy: new Types.ObjectId(tutorId) as any,
      assignedAt: new Date(),
      status: 'active', // Tutor-assigned goals are immediately active
      isActive: true,
    } as any);

    // Notify student
    const tutor = await userRepository.findById(tutorId);
    const tutorName = tutor
      ? `${(tutor as any).firstName} ${(tutor as any).lastName}`
      : 'Your tutor';
    await notificationService.notifyGoalAssigned(studentId, title, tutorName).catch(console.error);

    res.status(201).json({
      success: true,
      goal: {
        id: (goal as any)._id.toString(),
        studentId,
        title: (goal as any).title,
        description: (goal as any).description,
        target: (goal as any).target,
        current: (goal as any).current,
        deadline: (goal as any).deadline,
        milestones: (goal as any).milestones,
        assignedBy: tutorId,
        assignedAt: (goal as any).assignedAt,
        status: (goal as any).status || 'active',
      },
    });
  });

  // Get pending goals (student-initiated goals awaiting approval)
  static getPendingGoals = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 10, 50);

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can view pending goals', 403);
    }

    // Get all students assigned to this tutor (you may need to implement this relationship)
    // For now, get all goals with status 'pending_approval' where assignedBy is null
    // In a full implementation, you'd filter by tutor's students
    const allPendingGoals = await goalRepository.find({
      status: 'pending_approval',
      assignedBy: { $exists: false }, // Student-initiated goals don't have assignedBy
    } as any);

    const total = allPendingGoals.length;
    const paginatedGoals = (allPendingGoals as any[]).slice(skip, skip + limit);

    // Get student names for each goal
    const goalsWithStudents = await Promise.all(
      paginatedGoals.map(async (goal: any) => {
        const student = await userRepository.findById(goal.userId.toString());
        const studentName = student
          ? `${(student as any).firstName} ${(student as any).lastName}`
          : 'Unknown Student';

        return {
          id: goal._id.toString(),
          studentId: goal.userId.toString(),
          studentName,
          title: goal.title,
          description: goal.description,
          target: goal.target,
          current: goal.current,
          deadline: goal.deadline,
          createdAt: goal.createdAt,
        };
      })
    );

    const paginationResult = createPaginationResult(goalsWithStudents, total, page, limit);
    res.json({
      success: true,
      goals: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Approve a pending goal
  static approveGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { goalId } = req.params;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can approve goals', 403);
    }

    const goal = await goalRepository.findById(goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    if ((goal as any).status !== 'pending_approval') {
      throw new AppError('Goal is not pending approval', 400);
    }

    // Approve the goal
    (goal as any).status = 'active';
    await (goal as any).save();

    // Notify student
    await notificationService
      .notifyGoalApproved((goal as any).userId.toString(), (goal as any).title)
      .catch(console.error);

    res.json({
      success: true,
      goal: {
        id: (goal as any)._id.toString(),
        status: 'active',
        message: 'Goal approved successfully',
      },
    });
  });

  // Reject a pending goal with feedback
  static rejectGoal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { goalId } = req.params;
    const { feedback } = req.body;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can reject goals', 403);
    }

    const goal = await goalRepository.findById(goalId);
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }

    if ((goal as any).status !== 'pending_approval') {
      throw new AppError('Goal is not pending approval', 400);
    }

    // Reject the goal with feedback
    (goal as any).status = 'rejected';
    (goal as any).tutorFeedback = feedback || 'Goal needs adjustment. Please revise and resubmit.';
    await (goal as any).save();

    // Notify student
    await notificationService
      .notifyGoalRejected((goal as any).userId.toString(), (goal as any).title, feedback)
      .catch(console.error);

    res.json({
      success: true,
      goal: {
        id: (goal as any)._id.toString(),
        status: 'rejected',
        tutorFeedback: (goal as any).tutorFeedback,
        message: 'Goal rejected with feedback',
      },
    });
  });
}
