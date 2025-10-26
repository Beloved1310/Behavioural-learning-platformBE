import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare class ChatController {
    static getUserChats(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getOrCreateChat(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getChatMessages(req: AuthenticatedRequest, res: Response): Promise<void>;
    static markMessagesAsRead(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deleteChat(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void>;
    static searchUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
    static sendMessage(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=chatController.d.ts.map