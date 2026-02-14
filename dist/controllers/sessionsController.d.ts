import { Response } from 'express';
export declare class SessionsController {
    static getUserSessions: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static createSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateSessionStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static searchTutors: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getTutorAvailability: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static bookTutorSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=sessionsController.d.ts.map