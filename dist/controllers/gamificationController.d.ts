import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class GamificationController {
    static getQuizzes(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getQuizById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static submitQuizAttempt(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getRecentAttempts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUserProgress(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getAvailableBadges(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getLeaderboard(req: AuthenticatedRequest, res: Response): Promise<void>;
    private static checkBadgeEligibility;
}
//# sourceMappingURL=gamificationController.d.ts.map