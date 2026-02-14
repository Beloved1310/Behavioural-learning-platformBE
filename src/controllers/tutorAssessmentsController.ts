import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import weeklyAssessmentRepository from '../repositories/WeeklyAssessmentRepository';
import userRepository from '../repositories/UserRepository';
import { Types } from 'mongoose';
import notificationService from '../services/notificationService';

export class TutorAssessmentsController {
  // Get student's weekly assessments
  static getStudentAssessments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    // Verify tutor has access to this student (you may want to add relationship check)
    const assessments = await weeklyAssessmentRepository.findByUser(studentId, limit);

    res.json({
      success: true,
      assessments: (assessments as any[]).map((assessment: any) => ({
        id: assessment._id.toString(),
        userId: assessment.userId.toString(),
        weekStart: assessment.weekStart,
        weekRating: assessment.weekRating,
        whatWentWell: assessment.whatWentWell,
        challenges: assessment.challenges,
        nextWeekFocus: assessment.nextWeekFocus,
        commitmentLevel: assessment.commitmentLevel,
        tutorFeedback: assessment.tutorFeedback,
        completedAt: assessment.completedAt,
        createdAt: assessment.createdAt,
      })),
    });
  });

  // Get assessments pending feedback
  static getPendingFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get assessments without tutor feedback (you may want to filter by tutor's students)
    const assessments = await weeklyAssessmentRepository.find(
      {
        tutorFeedback: { $exists: false },
      } as any,
      { sort: { completedAt: -1 }, limit }
    );

    res.json({
      success: true,
      assessments: (assessments as any[]).map((assessment: any) => ({
        id: assessment._id.toString(),
        userId: assessment.userId.toString(),
        weekStart: assessment.weekStart,
        weekRating: assessment.weekRating,
        whatWentWell: assessment.whatWentWell,
        challenges: assessment.challenges,
        nextWeekFocus: assessment.nextWeekFocus,
        commitmentLevel: assessment.commitmentLevel,
        completedAt: assessment.completedAt,
      })),
    });
  });

  // Add feedback to assessment
  static addFeedback = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tutorId = req.user!.id;
    const { assessmentId } = req.params;
    const { comment, encouragementLevel } = req.body;

    if (!comment || !comment.trim()) {
      throw new AppError('Comment is required', 400);
    }

    const validLevels = ['low', 'medium', 'high'];
    const level =
      encouragementLevel && validLevels.includes(encouragementLevel)
        ? encouragementLevel
        : 'medium';

    const assessment = await weeklyAssessmentRepository.addTutorFeedback(
      assessmentId,
      tutorId,
      comment.trim(),
      level as 'low' | 'medium' | 'high'
    );

    if (!assessment) {
      throw new AppError('Assessment not found', 404);
    }

    // Notify student
    const tutor = await userRepository.findById(tutorId);
    const tutorName = tutor
      ? `${(tutor as any).firstName} ${(tutor as any).lastName}`
      : 'Your tutor';
    await notificationService
      .notifyAssessmentFeedback((assessment as any).userId.toString(), tutorName)
      .catch(console.error);

    res.json({
      success: true,
      message: 'Feedback added successfully',
      assessment: {
        id: (assessment as any)._id.toString(),
        tutorFeedback: (assessment as any).tutorFeedback,
      },
    });
  });
}
