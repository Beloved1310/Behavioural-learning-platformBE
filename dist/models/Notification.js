"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        index: true,
        enum: [
            'study_reminder',
            'session_reminder',
            'quiz_available',
            'badge_earned',
            'message_received',
            'payment_success',
            'progress_report',
            'system_announcement'
        ]
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    data: {
        type: mongoose_1.Schema.Types.Mixed // Additional data for the notification
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
// Virtual to populate user details
notificationSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email'
});
// Instance method to mark as read
notificationSchema.methods.markAsRead = function () {
    this.isRead = true;
    return this.save();
};
// Static method to get user notifications
notificationSchema.statics.getUserNotifications = function (userId, page = 1, limit = 20, unreadOnly = false) {
    const query = { userId };
    if (unreadOnly) {
        query.isRead = false;
    }
    const skip = (page - 1) * limit;
    return this.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
// Static method to get unread count
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({ userId, isRead: false });
};
// Static method to mark all as read
notificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany({ userId, isRead: false }, { isRead: true });
};
// Static method to create notification
notificationSchema.statics.createNotification = function (notificationData) {
    return this.create(notificationData);
};
// Static method to bulk create notifications
notificationSchema.statics.createBulkNotifications = function (notifications) {
    return this.insertMany(notifications);
};
// Static method to get notification statistics
notificationSchema.statics.getNotificationStats = function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose_1.Schema.Types.ObjectId(userId),
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                unreadCount: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                }
            }
        }
    ]);
};
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
//# sourceMappingURL=Notification.js.map