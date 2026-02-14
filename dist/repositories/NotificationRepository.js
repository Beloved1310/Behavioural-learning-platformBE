"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRepository = void 0;
const mongoose_1 = require("mongoose");
const Notification_1 = require("../models/Notification");
const BaseRepository_1 = require("./BaseRepository");
class NotificationRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Notification_1.Notification);
    }
    /**
     * Find notifications by user ID with filters
     */
    async findByUserId(userId, options = {}) {
        const query = {
            userId: new mongoose_1.Types.ObjectId(userId),
        };
        if (options.unreadOnly) {
            query.isRead = false;
        }
        if (options.type) {
            query.type = options.type;
        }
        return await this.find(query, {
            sort: { createdAt: -1 },
            skip: options.skip,
            limit: options.limit,
        });
    }
    /**
     * Count notifications by user ID with filters
     */
    async countByUserId(userId, filters = {}) {
        const query = {
            userId: new mongoose_1.Types.ObjectId(userId),
        };
        if (filters.unreadOnly) {
            query.isRead = false;
        }
        if (filters.type) {
            query.type = filters.type;
        }
        return await this.count(query);
    }
    /**
     * Get unread count for user
     */
    async getUnreadCount(userId) {
        return await this.count({
            userId: new mongoose_1.Types.ObjectId(userId),
            isRead: false,
        });
    }
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId) {
        return await this.updateOne({ _id: new mongoose_1.Types.ObjectId(notificationId) }, { isRead: true });
    }
    /**
     * Mark all notifications as read for user
     */
    async markAllAsRead(userId) {
        return await this.model.updateMany({ userId: new mongoose_1.Types.ObjectId(userId), isRead: false }, { isRead: true });
    }
    /**
     * Delete notification by ID
     */
    async deleteById(notificationId) {
        return await this.deleteOne({
            _id: new mongoose_1.Types.ObjectId(notificationId),
        });
    }
}
exports.notificationRepository = new NotificationRepository();
exports.default = exports.notificationRepository;
//# sourceMappingURL=NotificationRepository.js.map