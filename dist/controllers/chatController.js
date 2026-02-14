"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const chatService_1 = require("../services/chatService");
const pagination_1 = require("../utils/pagination");
const logger_1 = require("../utils/logger");
class ChatController {
}
exports.ChatController = ChatController;
_a = ChatController;
ChatController.getUserChats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const search = req.query.search;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    logger_1.logger.debug(`[ChatController.getUserChats] Loading chats for userId: ${userId}, search: ${search || 'none'}, page: ${page}, limit: ${limit}`);
    const result = await chatService_1.ChatService.getUserChats(userId, search, page, limit, skip);
    logger_1.logger.debug(`[ChatController.getUserChats] Found ${result.chats.length} chats for user ${userId}, total: ${result.total}`);
    const paginationResult = (0, pagination_1.createPaginationResult)(result.chats, result.total, page, limit);
    res.json({
        success: true,
        chats: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
ChatController.getChatById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const chat = await chatService_1.ChatService.getChatById(userId, chatId);
    res.json({ chat });
});
ChatController.getOrCreateChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { otherUserId } = req.body;
    if (!otherUserId)
        throw new errorHandler_1.AppError('Other user ID is required', 400);
    const chat = await chatService_1.ChatService.getOrCreateChat(userId, otherUserId);
    res.json({ chat });
});
ChatController.createNewChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { otherUserId, title, returnExisting = true } = req.body;
    if (!otherUserId) {
        throw new errorHandler_1.AppError('Other user ID is required', 400);
    }
    const chat = await chatService_1.ChatService.createNewChat(userId, otherUserId, userRole, title, returnExisting);
    res.status(201).json({
        success: true,
        message: chat.isExisting ? 'Existing chat retrieved' : 'New chat created successfully',
        chat,
    });
});
ChatController.getChatMessages = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 50, 200);
    logger_1.logger.debug(`[ChatController.getChatMessages] Request - userId: ${userId}, chatId: ${chatId}, page: ${page}, limit: ${limit}`);
    const result = await chatService_1.ChatService.getChatMessages(userId, chatId, page, limit, skip);
    logger_1.logger.debug(`[ChatController.getChatMessages] Returning ${result.messages?.length || 0} messages, total: ${result.total}`);
    const paginationResult = (0, pagination_1.createPaginationResult)(result.messages || [], result.total || 0, page, limit);
    res.json({
        success: true,
        messages: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
ChatController.markMessagesAsRead = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    await chatService_1.ChatService.markMessagesAsRead(userId, chatId);
    res.json({ success: true, message: 'Messages marked as read' });
});
ChatController.deleteChat = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    await chatService_1.ChatService.deleteChat(userId, chatId);
    res.json({ success: true, message: 'Chat deleted successfully' });
});
ChatController.getUnreadCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const unreadCount = await chatService_1.ChatService.getUnreadCount(userId);
    res.json({ unreadCount });
});
ChatController.searchUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { query } = req.query;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    const result = await chatService_1.ChatService.searchUsers(userId, query, userRole, page, limit, skip);
    const paginationResult = (0, pagination_1.createPaginationResult)(result.users, result.total, page, limit);
    res.json({
        success: true,
        users: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
ChatController.getAvailableUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, skip } = (0, pagination_1.getPaginationParams)(req, 20, 100);
    logger_1.logger.debug(`[ChatController.getAvailableUsers] Getting available users for userId: ${userId}, role: ${userRole}, page: ${page}, limit: ${limit}`);
    const result = await chatService_1.ChatService.getAvailableUsers(userId, userRole, page, limit, skip);
    logger_1.logger.debug(`[ChatController.getAvailableUsers] Returning ${result.users.length} users, total: ${result.total}`);
    const paginationResult = (0, pagination_1.createPaginationResult)(result.users, result.total, page, limit);
    res.json({
        success: true,
        users: paginationResult.data,
        pagination: paginationResult.pagination,
    });
});
ChatController.sendMessage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { content, type, fileUrl, fileName } = req.body;
    const message = await chatService_1.ChatService.sendMessage(userId, chatId, {
        content,
        type,
        fileUrl,
        fileName,
    });
    res.json({ message });
});
//# sourceMappingURL=chatController.js.map