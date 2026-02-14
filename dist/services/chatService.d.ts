export declare class ChatService {
    static getUserChats(userId: string, search?: string, page?: number, limit?: number, skip?: number): Promise<{
        chats: {
            id: any;
            participants: any;
            title: any;
            lastMessage: {
                id: any;
                senderId: string;
                senderName: string;
                content: any;
                type: any;
                createdAt: string;
                isRead: any;
            } | null;
            unreadCount: any;
            updatedAt: string;
            createdAt: string;
            lastActivity: string;
        }[];
        total: number;
    }>;
    static getOrCreateChat(userId: string, otherUserId: string): Promise<{
        id: any;
        participants: any;
        title: any;
        lastMessage: {
            id: any;
            senderId: string;
            senderName: string;
            content: any;
            type: any;
            createdAt: string;
            isRead: any;
        } | null;
        unreadCount: any;
        updatedAt: string;
        createdAt: string;
        lastActivity: string;
    }>;
    static createNewChat(userId: string, otherUserId: string, currentUserRole: string, title?: string, returnExisting?: boolean): Promise<{
        id: any;
        participants: any;
        title: any;
        lastMessage: {
            id: any;
            senderId: string;
            senderName: string;
            content: any;
            type: any;
            createdAt: string;
            isRead: any;
        } | null;
        unreadCount: any;
        updatedAt: string;
        createdAt: string;
        lastActivity: string;
        isExisting: boolean;
    }>;
    static getChatById(userId: string, chatId: string): Promise<{
        id: any;
        participants: any;
        title: any;
        lastMessage: {
            id: any;
            senderId: string;
            senderName: string;
            content: any;
            type: any;
            createdAt: string;
            isRead: any;
        } | null;
        unreadCount: any;
        updatedAt: string;
        createdAt: string;
        lastActivity: string;
    }>;
    static getChatMessages(userId: string, chatId: string, page: number, limit: number, skip?: number): Promise<any>;
    static markMessagesAsRead(userId: string, chatId: string): Promise<void>;
    static deleteChat(userId: string, chatId: string): Promise<void>;
    static getUnreadCount(userId: string): Promise<any>;
    static searchUsers(userId: string, query: string, currentUserRole?: string, page?: number, limit?: number, skip?: number): Promise<{
        users: {
            id: any;
            firstName: any;
            lastName: any;
            name: string;
            email: any;
            profileImage: any;
            role: any;
        }[];
        total: any;
    }>;
    static getAvailableUsers(userId: string, currentUserRole?: string, page?: number, limit?: number, skip?: number): Promise<{
        users: {
            id: any;
            firstName: any;
            lastName: any;
            name: string;
            email: any;
            profileImage: any;
            role: any;
        }[];
        total: any;
    }>;
    static sendMessage(userId: string, chatId: string, data: {
        content: string;
        type?: string;
        fileUrl?: string;
        fileName?: string;
    }): Promise<{
        id: any;
        chatId: any;
        senderId: string;
        sender: {
            id: string;
            firstName: any;
            lastName: any;
            name: string;
            profileImage: any;
            role: any;
        };
        type: any;
        content: any;
        fileUrl: any;
        fileName: any;
        isRead: any;
        createdAt: any;
    }>;
}
export default ChatService;
//# sourceMappingURL=chatService.d.ts.map