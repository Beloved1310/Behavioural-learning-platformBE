import { Response } from 'express';
export declare class ChatController {
    static getUserChats: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getChatById: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getOrCreateChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static createNewChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getChatMessages: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static markMessagesAsRead: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static deleteChat: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getUnreadCount: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static searchUsers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static getAvailableUsers: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
    static sendMessage: (req: import("express").Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=chatController.d.ts.map