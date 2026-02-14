import { Response } from 'express';
export declare class BehavioralController {
    static trackEvent: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getEventHistory: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getEventCounts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPageViews: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getBehavioralInsights: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getStudyConsistency: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getConsistencyScore: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getRecommendations: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static generateRecommendations: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markRecommendationAsRead: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markRecommendationAsActioned: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getProgressReports: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static generateProgressReport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getSentimentAnalysis: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static trackEngagement: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static recordBehavioralData: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getWeeklyProgressSummary: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMotivationalNudges: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getReflectionPrompts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getMotivationalPrompts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=behavioralController.d.ts.map