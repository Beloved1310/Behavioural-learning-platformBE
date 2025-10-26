import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class UserController {
    static getProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updateProfile(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updatePassword(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static uploadProfileImage(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteProfileImage(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map