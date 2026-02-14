import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import habitsService from '../services/habitsService';

export class HabitsController {
  // Get habit heatmap data
  static getHeatmap = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const days = parseInt(req.query.days as string) || 30;

    const heatmap = await habitsService.getHeatmap(userId, days);

    res.json({ success: true, heatmap });
  });

  // Get all active streaks
  static getStreaks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;

    const streaks = await habitsService.getStreaks(userId);

    res.json({
      success: true,
      streaks,
    });
  });
}
