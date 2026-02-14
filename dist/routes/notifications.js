"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const user_1 = require("../validation/user");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get user notifications
router.get('/', (0, middleware_1.validate)(user_1.getUserNotificationsSchema), notificationController_1.NotificationController.getNotifications);
// Get unread count
router.get('/unread-count', notificationController_1.NotificationController.getUnreadCount);
// Mark notification as read
router.patch('/:notificationId/read', (0, middleware_1.validate)(user_1.markNotificationReadSchema), notificationController_1.NotificationController.markAsRead);
// Mark all notifications as read
router.patch('/read-all', notificationController_1.NotificationController.markAllAsRead);
// Delete notification
router.delete('/:notificationId', (0, middleware_1.validate)(user_1.markNotificationReadSchema), notificationController_1.NotificationController.deleteNotification);
exports.default = router;
//# sourceMappingURL=notifications.js.map