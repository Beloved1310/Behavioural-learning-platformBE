import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import assessmentService from '../services/assessmentService';

export class AssessmentsController {
  // Get current week's assessment
  static getCurrentAssessment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const assessment = await assessmentService.getCurrentAssessment(userId);

    res.json({ success: true, assessment });
  });

  // Submit weekly assessment
  static submitAssessment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { weekRating, whatWentWell, challenges, nextWeekFocus, commitmentLevel } = req.body;

    const assessment = await assessmentService.submitAssessment(userId, {
      weekRating,
      whatWentWell,
      challenges,
      nextWeekFocus,
      commitmentLevel,
    });

    res.status(201).json({
      success: true,
      assessment,
    });
  });

  // Get assessment trends
  static getTrends = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const weeks = parseInt(req.query.weeks as string) || 8;

    const trends = await assessmentService.getTrends(userId, weeks);

    res.json({
      success: true,
      trends,
    });
  });
}
