import { Response } from 'express';
export declare class GamificationController {
    static createQuiz: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getQuizzes: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getQuizById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static submitQuizAttempt: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getRecentAttempts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUserProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUserProgress: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getAvailableBadges: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getLeaderboard: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getQuizAttempts: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=gamificationController.d.ts.map