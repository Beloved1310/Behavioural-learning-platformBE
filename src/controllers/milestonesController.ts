import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import milestoneService from '../services/milestoneService';

export class MilestonesController {
  // Get upcoming milestones
  static getUpcoming = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const upcoming = await milestoneService.getUpcoming(userId);

    res.json({
      success: true,
      upcoming,
    });
  });

  // Check and award milestones
  static checkMilestones = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await milestoneService.checkMilestones(userId);

    res.json({
      success: true,
      ...result,
    });
  });
}
