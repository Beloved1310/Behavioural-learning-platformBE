"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chatController_1 = require("../controllers/chatController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const chat_1 = require("../validation/chat");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Chat management routes
router.get('/chats', (0, middleware_1.validate)(chat_1.getChatsSchema), chatController_1.ChatController.getUserChats);
router.get('/chats/:chatId', (0, middleware_1.validate)(chat_1.getChatByIdSchema), chatController_1.ChatController.getChatById); // Get chat by ID
router.post('/chats', (0, middleware_1.validate)(chat_1.getOrCreateChatSchema), chatController_1.ChatController.getOrCreateChat);
router.post('/chats/new', (0, middleware_1.validate)(chat_1.createNewChatSchema), chatController_1.ChatController.createNewChat); // Create new chat endpoint
router.delete('/chats/:chatId', (0, middleware_1.validate)(chat_1.getChatByIdSchema), chatController_1.ChatController.deleteChat);
// Message routes
router.get('/chats/:chatId/messages', (0, middleware_1.validate)(chat_1.getChatMessagesSchema), chatController_1.ChatController.getChatMessages);
router.post('/chats/:chatId/messages', (0, middleware_1.validate)(chat_1.sendMessageSchema), chatController_1.ChatController.sendMessage);
router.put('/chats/:chatId/read', (0, middleware_1.validate)(chat_1.markMessagesReadSchema), chatController_1.ChatController.markMessagesAsRead);
// Utility routes
router.get('/unread-count', chatController_1.ChatController.getUnreadCount);
router.get('/users/search', (0, middleware_1.validate)(chat_1.searchUsersSchema), chatController_1.ChatController.searchUsers);
router.get('/users/available', chatController_1.ChatController.getAvailableUsers);
exports.default = router;
//# sourceMappingURL=chat.js.map