import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { ChatService } from '../services/chatService';
import { getPaginationParams, createPaginationResult } from '../utils/pagination';
import { logger } from '../utils/logger';

export class ChatController {
  static getUserChats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const search = req.query.search as string | undefined;
    const { page, limit, skip } = getPaginationParams(req, 20, 100);

    logger.debug(`[ChatController.getUserChats] Loading chats for userId: ${userId}, search: ${search || 'none'}, page: ${page}, limit: ${limit}`);
    const result = await ChatService.getUserChats(userId, search, page, limit, skip);
    logger.debug(`[ChatController.getUserChats] Found ${result.chats.length} chats for user ${userId}, total: ${result.total}`);

    const paginationResult = createPaginationResult(result.chats, result.total, page, limit);
    res.json({
      success: true,
      chats: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  static getChatById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const chat = await ChatService.getChatById(userId, chatId);
    res.json({ chat });
  });

  static getOrCreateChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { otherUserId } = req.body;
    if (!otherUserId) throw new AppError('Other user ID is required', 400);
    const chat = await ChatService.getOrCreateChat(userId, otherUserId);
    res.json({ chat });
  });

  static createNewChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { otherUserId, title, returnExisting = true } = req.body;

    if (!otherUserId) {
      throw new AppError('Other user ID is required', 400);
    }

    const chat = await ChatService.createNewChat(
      userId,
      otherUserId,
      userRole,
      title,
      returnExisting
    );
    res.status(201).json({
      success: true,
      message: chat.isExisting ? 'Existing chat retrieved' : 'New chat created successfully',
      chat,
    });
  });

  static getChatMessages = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { page, limit, skip } = getPaginationParams(req, 50, 200);

    logger.debug(`[ChatController.getChatMessages] Request - userId: ${userId}, chatId: ${chatId}, page: ${page}, limit: ${limit}`);
    const result = await ChatService.getChatMessages(userId, chatId, page, limit, skip);
    logger.debug(`[ChatController.getChatMessages] Returning ${result.messages?.length || 0} messages, total: ${result.total}`);

    const paginationResult = createPaginationResult(
      result.messages || [],
      result.total || 0,
      page,
      limit
    );
    res.json({
      success: true,
      messages: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  static markMessagesAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { chatId } = req.params;
    await ChatService.markMessagesAsRead(userId, chatId);
    res.json({ success: true, message: 'Messages marked as read' });
  });

  static deleteChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { chatId } = req.params;
    await ChatService.deleteChat(userId, chatId);
    res.json({ success: true, message: 'Chat deleted successfully' });
  });

  static getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const unreadCount = await ChatService.getUnreadCount(userId);
    res.json({ unreadCount });
  });

  static searchUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { query } = req.query as any;
    const { page, limit, skip } = getPaginationParams(req, 20, 100);

    const result = await ChatService.searchUsers(userId, query, userRole, page, limit, skip);
    const paginationResult = createPaginationResult(result.users, result.total, page, limit);

    res.json({
      success: true,
      users: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  static getAvailableUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { page, limit, skip } = getPaginationParams(req, 20, 100);

    logger.debug(`[ChatController.getAvailableUsers] Getting available users for userId: ${userId}, role: ${userRole}, page: ${page}, limit: ${limit}`);
    const result = await ChatService.getAvailableUsers(userId, userRole, page, limit, skip);
    logger.debug(`[ChatController.getAvailableUsers] Returning ${result.users.length} users, total: ${result.total}`);

    const paginationResult = createPaginationResult(result.users, result.total, page, limit);
    res.json({
      success: true,
      users: paginationResult.data,
      pagination: paginationResult.pagination,
    });
  });

  static sendMessage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { chatId } = req.params;
    const { content, type, fileUrl, fileName } = req.body;
    const message = await ChatService.sendMessage(userId, chatId, {
      content,
      type,
      fileUrl,
      fileName,
    });
    res.json({ message });
  });
}
