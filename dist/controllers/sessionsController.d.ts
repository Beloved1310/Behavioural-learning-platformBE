import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class SessionsController {
    static getUserSessions(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSessionById(req: AuthenticatedRequest, res: Response): Promise<void>;
    static createSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteSession(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateSessionStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getSessionStats(req: AuthenticatedRequest, res: Response): Promise<void>;
    static searchTutors(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getTutorAvailability(req: AuthenticatedRequest, res: Response): Promise<void>;
    static bookTutorSession(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=sessionsController.d.ts.map