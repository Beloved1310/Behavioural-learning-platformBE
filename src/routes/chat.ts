import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  getChatsSchema,
  getChatByIdSchema,
  getOrCreateChatSchema,
  createNewChatSchema,
  getChatMessagesSchema,
  sendMessageSchema,
  markMessagesReadSchema,
  searchUsersSchema,
} from '../validation/chat';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Chat management routes
router.get('/chats', validate(getChatsSchema), ChatController.getUserChats);
router.get('/chats/:chatId', validate(getChatByIdSchema), ChatController.getChatById); // Get chat by ID
router.post('/chats', validate(getOrCreateChatSchema), ChatController.getOrCreateChat);
router.post('/chats/new', validate(createNewChatSchema), ChatController.createNewChat); // Create new chat endpoint
router.delete('/chats/:chatId', validate(getChatByIdSchema), ChatController.deleteChat);

// Message routes
router.get('/chats/:chatId/messages', validate(getChatMessagesSchema), ChatController.getChatMessages);
router.post('/chats/:chatId/messages', validate(sendMessageSchema), ChatController.sendMessage);
router.put('/chats/:chatId/read', validate(markMessagesReadSchema), ChatController.markMessagesAsRead);

// Utility routes
router.get('/unread-count', ChatController.getUnreadCount);
router.get('/users/search', validate(searchUsersSchema), ChatController.searchUsers);
router.get('/users/available', ChatController.getAvailableUsers);

export default router;
