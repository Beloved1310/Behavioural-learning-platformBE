import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import reflectionEntryRepository from '../repositories/ReflectionEntryRepository';
import userRepository from '../repositories/UserRepository';
import { Types } from 'mongoose';
import { UserRole } from '../types';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import notificationService from '../services/notificationService';

export class TutorReflectionsController {
  // Get all reflections for a specific student
  static getStudentReflections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { studentId } = req.params;
    const { page, limit, skip } = getPaginationParams(req, 20, 100);

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can view student reflections', 403);
    }

    // Verify student exists
    const student = await userRepository.findById(studentId);
    if (!student) {
      throw new AppError('Student not found', 404);
    }

    // Get all reflections first, then paginate
    const allReflections = await reflectionEntryRepository.findByUser(studentId, 1000);
    const total = allReflections.length;
    const paginatedReflections = (allReflections as any[]).slice(skip, skip + limit);

    const transformed = paginatedReflections.map((reflection) => ({
      id: reflection._id.toString(),
      date: reflection.date,
      prompt: reflection.prompt,
      response: reflection.response,
      type: reflection.type,
      mood: reflection.mood,
      tutorFeedback: reflection.tutorFeedback
        ? {
            tutorId: reflection.tutorFeedback.tutorId.toString(),
            comment: reflection.tutorFeedback.comment,
            feedbackAt: reflection.tutorFeedback.feedbackAt,
            isRead: reflection.tutorFeedback.isRead,
          }
        : null,
      createdAt: reflection.createdAt,
    }));

    const paginationResult = createPaginationResult(transformed, total, page, limit);
    res.json({
      success: true,
      reflections: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  // Add feedback to a reflection
  static addFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { reflectionId } = req.params;
    const { comment } = req.body;

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can add feedback', 403);
    }

    if (!comment || comment.trim().length === 0) {
      throw new AppError('Comment is required', 400);
    }

    if (comment.length > 500) {
      throw new AppError('Comment must be 500 characters or less', 400);
    }

    const reflection = await reflectionEntryRepository.findById(reflectionId);
    if (!reflection) {
      throw new AppError('Reflection not found', 404);
    }

    // Add or update tutor feedback
    (reflection as any).tutorFeedback = {
      tutorId: new Types.ObjectId(tutorId),
      comment: comment.trim(),
      feedbackAt: new Date(),
      isRead: false,
    };

    await (reflection as any).save();

    // Notify student
    const tutor = await userRepository.findById(tutorId);
    const tutorName = tutor
      ? `${(tutor as any).firstName} ${(tutor as any).lastName}`
      : 'Your tutor';
    await notificationService
      .notifyReflectionFeedback((reflection as any).userId.toString(), tutorName)
      .catch(console.error);

    res.json({
      success: true,
      reflection: {
        id: (reflection as any)._id.toString(),
        tutorFeedback: {
          tutorId: tutorId,
          comment: (reflection as any).tutorFeedback.comment,
          feedbackAt: (reflection as any).tutorFeedback.feedbackAt,
          isRead: (reflection as any).tutorFeedback.isRead,
        },
      },
    });
  });

  // Get all reflections with pending feedback (for tutor dashboard)
  static getPendingFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { page, limit, skip } = getPaginationParams(req, 20, 100);

    if (req.user!.role !== UserRole.TUTOR) {
      throw new AppError('Only tutors can view pending feedback', 403);
    }

    // Get all reflections without tutor feedback (for MVP, we'll get recent reflections)
    // In a full implementation, you'd filter by tutor's students
    const ReflectionEntry = (await import('../models/ReflectionEntry')).ReflectionEntry;

    // Get total count
    const total = await ReflectionEntry.countDocuments({
      tutorFeedback: { $exists: false },
    });

    // Get paginated reflections
    const reflections = await ReflectionEntry.find({
      tutorFeedback: { $exists: false },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'firstName lastName');

    const transformed = (reflections as any[]).map((reflection) => {
      const student = reflection.userId;
      const studentName = student
        ? `${(student as any).firstName} ${(student as any).lastName}`
        : 'Unknown Student';

      return {
        id: reflection._id.toString(),
        studentId: reflection.userId._id.toString(),
        studentName,
        date: reflection.date,
        prompt: reflection.prompt,
        response: reflection.response,
        type: reflection.type,
        mood: reflection.mood,
        createdAt: reflection.createdAt,
      };
    });

    const paginationResult = createPaginationResult(transformed, total, page, limit);
    res.json({
      success: true,
      reflections: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });
}
