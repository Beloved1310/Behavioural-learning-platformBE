import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class BehavioralController {
    static logMood(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMoodHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMoodDistribution(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMoodTrends(req: AuthenticatedRequest, res: Response): Promise<void>;
    static trackEvent(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getEventHistory(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getEventCounts(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getPageViews(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getBehavioralInsights(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getStudyConsistency(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getRecommendations(req: AuthenticatedRequest, res: Response): Promise<void>;
    static generateRecommendations(req: AuthenticatedRequest, res: Response): Promise<void>;
    static markRecommendationAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    static markRecommendationAsActioned(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getProgressReports(req: AuthenticatedRequest, res: Response): Promise<void>;
    static generateProgressReport(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSentimentAnalysis(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getMotivationalPrompts(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=behavioralController.d.ts.map