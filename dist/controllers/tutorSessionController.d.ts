import { Response } from 'express';
export declare class TutorSessionController {
    static getPendingRequests: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static approveRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static rejectRequest: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static createSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static rescheduleSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static cancelSession: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=tutorSessionController.d.ts.map