import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class PreferencesController {
    static getPreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
    static updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
    static resetPreferences(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=preferencesController.d.ts.map