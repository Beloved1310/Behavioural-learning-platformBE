"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Chat management routes
router.get('/chats', chatController_1.ChatController.getUserChats);
router.post('/chats', chatController_1.ChatController.getOrCreateChat);
router.delete('/chats/:chatId', chatController_1.ChatController.deleteChat);
// Message routes
router.get('/chats/:chatId/messages', chatController_1.ChatController.getChatMessages);
router.post('/chats/:chatId/messages', chatController_1.ChatController.sendMessage);
router.put('/chats/:chatId/read', chatController_1.ChatController.markMessagesAsRead);
// Utility routes
router.get('/unread-count', chatController_1.ChatController.getUnreadCount);
router.get('/users/search', chatController_1.ChatController.searchUsers);
exports.default = router;
//# sourceMappingURL=chat.js.map