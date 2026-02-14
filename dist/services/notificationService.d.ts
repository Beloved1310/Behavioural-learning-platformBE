export interface CreateNotificationData {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
}
declare class NotificationService {
    /**
     * Create a notification
     */
    createNotification(data: CreateNotificationData): Promise<import("../types").INotification>;
    /**
     * Create multiple notifications (bulk)
     */
    createBulkNotifications(notifications: CreateNotificationData[]): Promise<import("../types").INotification[]>;
    /**
     * Get user notifications with pagination
     */
    getNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
        type?: string;
    }): Promise<{
        notifications: {
            id: any;
            userId: any;
            type: any;
            title: any;
            message: any;
            data: any;
            isRead: any;
            createdAt: any;
        }[];
        unreadCount: number;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    /**
     * Get unread count for user
     */
    getUnreadCount(userId: string): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(userId: string, notificationId: string): Promise<{
        id: any;
        userId: any;
        type: any;
        title: any;
        message: any;
        data: any;
        isRead: any;
        createdAt: any;
    }>;
    /**
     * Mark all notifications as read for user
     */
    markAllAsRead(userId: string): Promise<{
        updatedCount: number;
    }>;
    /**
     * Delete notification
     */
    deleteNotification(userId: string, notificationId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Create notification when goal is approved
     */
    notifyGoalApproved(userId: string, goalTitle: string): Promise<import("../types").INotification>;
    /**
     * Create notification when goal is rejected
     */
    notifyGoalRejected(userId: string, goalTitle: string, feedback?: string): Promise<import("../types").INotification>;
    /**
     * Create notification when tutor assigns goal
     */
    notifyGoalAssigned(userId: string, goalTitle: string, tutorName: string): Promise<import("../types").INotification>;
    /**
     * Create notification when tutor assigns commitment
     */
    notifyCommitmentAssigned(userId: string, tutorName: string): Promise<import("../types").INotification>;
    /**
     * Create notification when tutor provides reflection feedback
     */
    notifyReflectionFeedback(userId: string, tutorName: string): Promise<import("../types").INotification>;
    /**
     * Create notification when tutor provides assessment feedback
     */
    notifyAssessmentFeedback(userId: string, tutorName: string): Promise<import("../types").INotification>;
    /**
     * Create notification when milestone is achieved
     */
    notifyMilestoneAchieved(userId: string, milestoneTitle: string): Promise<import("../types").INotification>;
    /**
     * Create notification for session reminder
     */
    notifySessionReminder(userId: string, sessionTitle: string, scheduledAt: Date): Promise<import("../types").INotification>;
    /**
     * Create notification for study reminder
     */
    notifyStudyReminder(userId: string, reminderTitle: string): Promise<import("../types").INotification>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notificationService.d.ts.map