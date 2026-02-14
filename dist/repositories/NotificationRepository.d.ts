import { INotification } from '../types';
import { BaseRepository } from './BaseRepository';
declare class NotificationRepository extends BaseRepository<INotification> {
    constructor();
    /**
     * Find notifications by user ID with filters
     */
    findByUserId(userId: string, options?: {
        unreadOnly?: boolean;
        type?: string;
        page?: number;
        limit?: number;
        skip?: number;
    }): Promise<INotification[]>;
    /**
     * Count notifications by user ID with filters
     */
    countByUserId(userId: string, filters?: {
        unreadOnly?: boolean;
        type?: string;
    }): Promise<number>;
    /**
     * Get unread count for user
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): Promise<INotification | null>;
    /**
     * Mark all notifications as read for user
     */
    markAllAsRead(userId: string): Promise<import("mongoose").UpdateWriteOpResult>;
    /**
     * Delete notification by ID
     */
    deleteById(notificationId: string): Promise<INotification | null>;
}
export declare const notificationRepository: NotificationRepository;
export default notificationRepository;
//# sourceMappingURL=NotificationRepository.d.ts.map