import { Response } from 'express';
export declare class UserController {
    static getProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updateProfile: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static updatePassword: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteAccount: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static uploadProfileImage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteProfileImage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getChildren: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static requestDataExport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static downloadDataExport: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=userController.d.ts.map