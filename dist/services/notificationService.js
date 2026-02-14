"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const NotificationRepository_1 = __importDefault(require("../repositories/NotificationRepository"));
const pagination_1 = require("../utils/pagination");
const errorHandler_1 = require("../middleware/errorHandler");
class NotificationService {
    /**
     * Create a notification
     */
    async createNotification(data) {
        return await NotificationRepository_1.default.create({
            userId: new mongoose_1.Types.ObjectId(data.userId),
            type: data.type,
            title: data.title,
            message: data.message,
            data: data.data || {},
        });
    }
    /**
     * Create multiple notifications (bulk)
     */
    async createBulkNotifications(notifications) {
        const notificationDocs = notifications.map((notif) => ({
            userId: new mongoose_1.Types.ObjectId(notif.userId),
            type: notif.type,
            title: notif.title,
            message: notif.message,
            data: notif.data || {},
        }));
        return await NotificationRepository_1.default.createMany(notificationDocs);
    }
    /**
     * Get user notifications with pagination
     */
    async getNotifications(userId, options = {}) {
        const { page, limit, skip } = (0, pagination_1.getPaginationParams)({ query: options }, options.limit || 20, 100);
        const total = await NotificationRepository_1.default.countByUserId(userId, {
            unreadOnly: options.unreadOnly,
            type: options.type,
        });
        const unreadCount = await NotificationRepository_1.default.getUnreadCount(userId);
        const notifications = await NotificationRepository_1.default.findByUserId(userId, {
            unreadOnly: options.unreadOnly,
            type: options.type,
            page,
            limit,
            skip,
        });
        const transformedNotifications = notifications.map((notif) => ({
            id: notif._id.toString(),
            userId: notif.userId.toString(),
            type: notif.type,
            title: notif.title,
            message: notif.message,
            data: notif.data || {},
            isRead: notif.isRead,
            createdAt: notif.createdAt,
        }));
        const paginationResult = (0, pagination_1.createPaginationResult)(transformedNotifications, total, page, limit);
        return {
            notifications: paginationResult.data,
            unreadCount,
            pagination: paginationResult.pagination,
        };
    }
    /**
     * Get unread count for user
     */
    async getUnreadCount(userId) {
        return await NotificationRepository_1.default.getUnreadCount(userId);
    }
    /**
     * Mark notification as read
     */
    async markAsRead(userId, notificationId) {
        // First verify the notification exists and belongs to user
        const notification = await NotificationRepository_1.default.findById(notificationId);
        if (!notification) {
            throw new errorHandler_1.AppError('Notification not found', 404);
        }
        if (notification.userId.toString() !== userId) {
            throw new errorHandler_1.AppError('Access denied', 403);
        }
        const updated = await NotificationRepository_1.default.markAsRead(notificationId);
        if (!updated) {
            throw new errorHandler_1.AppError('Failed to update notification', 500);
        }
        return {
            id: updated._id.toString(),
            userId: updated.userId.toString(),
            type: updated.type,
            title: updated.title,
            message: updated.message,
            data: updated.data || {},
            isRead: updated.isRead,
            createdAt: updated.createdAt,
        };
    }
    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId) {
        const result = await NotificationRepository_1.default.markAllAsRead(userId);
        return {
            updatedCount: result.modifiedCount,
        };
    }
    /**
     * Delete notification
     */
    async deleteNotification(userId, notificationId) {
        // First verify the notification exists and belongs to user
        const notification = await NotificationRepository_1.default.findById(notificationId);
        if (!notification) {
            throw new errorHandler_1.AppError('Notification not found', 404);
        }
        if (notification.userId.toString() !== userId) {
            throw new errorHandler_1.AppError('Access denied', 403);
        }
        await NotificationRepository_1.default.deleteById(notificationId);
        return { success: true };
    }
    /**
     * Create notification when goal is approved
     */
    async notifyGoalApproved(userId, goalTitle) {
        return await this.createNotification({
            userId,
            type: 'system_announcement',
            title: 'Goal Approved! 🎉',
            message: `Your goal "${goalTitle}" has been approved by your tutor.`,
            data: { goalTitle },
        });
    }
    /**
     * Create notification when goal is rejected
     */
    async notifyGoalRejected(userId, goalTitle, feedback) {
        return await this.createNotification({
            userId,
            type: 'system_announcement',
            title: 'Goal Needs Revision',
            message: `Your goal "${goalTitle}" was not approved. ${feedback ? `Feedback: ${feedback}` : 'Please review and resubmit.'}`,
            data: { goalTitle, feedback },
        });
    }
    /**
     * Create notification when tutor assigns goal
     */
    async notifyGoalAssigned(userId, goalTitle, tutorName) {
        return await this.createNotification({
            userId,
            type: 'system_announcement',
            title: 'New Goal Assigned',
            message: `${tutorName} has assigned you a new goal: "${goalTitle}"`,
            data: { goalTitle, tutorName },
        });
    }
    /**
     * Create notification when tutor assigns commitment
     */
    async notifyCommitmentAssigned(userId, tutorName) {
        return await this.createNotification({
            userId,
            type: 'system_announcement',
            title: 'New Weekly Commitment',
            message: `${tutorName} has assigned you weekly commitments. Check your dashboard to see them.`,
            data: { tutorName },
        });
    }
    /**
     * Create notification when tutor provides reflection feedback
     */
    async notifyReflectionFeedback(userId, tutorName) {
        return await this.createNotification({
            userId,
            type: 'message_received',
            title: 'Reflection Feedback',
            message: `${tutorName} has provided feedback on your reflection.`,
            data: { tutorName },
        });
    }
    /**
     * Create notification when tutor provides assessment feedback
     */
    async notifyAssessmentFeedback(userId, tutorName) {
        return await this.createNotification({
            userId,
            type: 'message_received',
            title: 'Assessment Feedback',
            message: `${tutorName} has provided feedback on your weekly assessment.`,
            data: { tutorName },
        });
    }
    /**
     * Create notification when milestone is achieved
     */
    async notifyMilestoneAchieved(userId, milestoneTitle) {
        return await this.createNotification({
            userId,
            type: 'badge_earned',
            title: 'Milestone Achieved! 🎉',
            message: `Congratulations! You've achieved: ${milestoneTitle}`,
            data: { milestoneTitle },
        });
    }
    /**
     * Create notification for session reminder
     */
    async notifySessionReminder(userId, sessionTitle, scheduledAt) {
        return await this.createNotification({
            userId,
            type: 'session_reminder',
            title: 'Session Reminder',
            message: `You have a session "${sessionTitle}" coming up soon.`,
            data: { sessionTitle, scheduledAt },
        });
    }
    /**
     * Create notification for study reminder
     */
    async notifyStudyReminder(userId, reminderTitle) {
        return await this.createNotification({
            userId,
            type: 'study_reminder',
            title: 'Study Reminder',
            message: reminderTitle,
            data: { reminderTitle },
        });
    }
}
exports.default = new NotificationService();
//# sourceMappingURL=notificationService.js.map