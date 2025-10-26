import { Router } from 'express';
import { ChatController } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Chat management routes
router.get('/chats', ChatController.getUserChats);
router.post('/chats', ChatController.getOrCreateChat);
router.delete('/chats/:chatId', ChatController.deleteChat);

// Message routes
router.get('/chats/:chatId/messages', ChatController.getChatMessages);
router.post('/chats/:chatId/messages', ChatController.sendMessage);
router.put('/chats/:chatId/read', ChatController.markMessagesAsRead);

// Utility routes
router.get('/unread-count', ChatController.getUnreadCount);
router.get('/users/search', ChatController.searchUsers);

export default router;
