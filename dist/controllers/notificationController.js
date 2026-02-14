"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const notificationService_1 = __importDefault(require("../services/notificationService"));
class NotificationController {
}
exports.NotificationController = NotificationController;
_a = NotificationController;
// Get user notifications
NotificationController.getNotifications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const unreadOnly = req.query.unreadOnly === 'true';
    const type = req.query.type;
    const result = await notificationService_1.default.getNotifications(userId, {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        unreadOnly,
        type,
    });
    res.json({
        success: true,
        ...result,
    });
});
// Get unread count
NotificationController.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const count = await notificationService_1.default.getUnreadCount(userId);
    res.json({ unreadCount: count });
});
// Mark notification as read
NotificationController.markAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    const notification = await notificationService_1.default.markAsRead(userId, notificationId);
    res.json({
        message: 'Notification marked as read',
        notification,
    });
});
// Mark all notifications as read
NotificationController.markAllAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const result = await notificationService_1.default.markAllAsRead(userId);
    res.json({
        message: 'All notifications marked as read',
        ...result,
    });
});
// Delete notification
NotificationController.deleteNotification = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { notificationId } = req.params;
    await notificationService_1.default.deleteNotification(userId, notificationId);
    res.json({ message: 'Notification deleted successfully' });
});
//# sourceMappingURL=notificationController.js.map