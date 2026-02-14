import { Response } from 'express';
export declare class AdminController {
    static getDashboardStats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getPendingTutors: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getTutorById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static approveTutor: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static rejectTutor: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static setBackgroundCheckStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getAllUsers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUserById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateUserStatus: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=adminController.d.ts.map