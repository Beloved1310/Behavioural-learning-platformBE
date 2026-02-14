import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static register: (req: Request, res: Response, next: NextFunction) => void;
    static login: (req: Request, res: Response, next: NextFunction) => void;
    static refreshToken: (req: Request, res: Response, next: NextFunction) => void;
    static logout: (req: Request, res: Response, next: NextFunction) => void;
    static verifyEmail: (req: Request, res: Response, next: NextFunction) => void;
    static resendVerificationEmail: (req: Request, res: Response, next: NextFunction) => void;
    static forgotPassword: (req: Request, res: Response, next: NextFunction) => void;
    static resetPassword: (req: Request, res: Response, next: NextFunction) => void;
    static getProfile: (req: Request, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=authController.d.ts.map