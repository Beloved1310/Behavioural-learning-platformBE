import { Types } from 'mongoose';
import chatRepository from '../repositories/ChatRepository';
import messageRepository from '../repositories/MessageRepository';
import userRepository from '../repositories/UserRepository';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../socket';
import { sendNotificationToUser } from '../socket';
import { logger } from '../utils/logger';

/**
 * Helper function to safely extract sender ID and name from a message
 */
function extractSenderInfo(senderId: any): { senderId: string; senderName: string } {
  let id: string = '';
  let name: string = 'Unknown';

  if (!senderId) {
    return { senderId: '', senderName: 'Unknown' };
  }

  // Handle populated senderId (user object) or ObjectId
  if (typeof senderId === 'object' && senderId !== null) {
    // If populated, it's a user object with _id, firstName, lastName
    if (senderId._id) {
      id = senderId._id.toString();
      name = `${senderId.firstName || ''} ${senderId.lastName || ''}`.trim() || 'Unknown';
    } else if (senderId.toString) {
      // It's an ObjectId
      id = senderId.toString();
      name = 'Unknown';
    }
  } else if (typeof senderId === 'string') {
    id = senderId;
    name = 'Unknown';
  }

  return { senderId: id, senderName: name };
}

export class ChatService {
  static async getUserChats(
    userId: string,
    search?: string,
    page?: number,
    limit?: number,
    skip?: number
  ) {
    logger.debug(
      `[ChatService.getUserChats] Loading chats for userId: ${userId}, search: ${search || 'none'}, page: ${page}, limit: ${limit}`
    );
    const chats: any[] = await chatRepository.findUserChats(userId); // Always fetch all chats, filter in service
    logger.debug(`[ChatService.getUserChats] Found ${chats.length} chats from repository`);

    // Filter by participant names if search is provided (after population)
    let filteredChats = chats;
    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      const searchTerms = searchLower.split(/\s+/).filter((term) => term.length > 0); // Split into individual words

      filteredChats = chats.filter((chat: any) => {
        // Check title
        if (chat.title && chat.title.toLowerCase().includes(searchLower)) {
          logger.debug('Chat match found by title', { chatId: chat._id?.toString(), title: chat.title });
          return true;
        }

        // Check participant names (excluding current user)
        const otherParticipants =
          chat.participants?.filter((p: any) => p._id && p._id.toString() !== userId) || [];

        for (const participant of otherParticipants) {
          const firstName = (participant.firstName || '').toLowerCase().trim();
          const lastName = (participant.lastName || '').toLowerCase().trim();
          const email = (participant.email || '').toLowerCase().trim();
          const fullName = `${firstName} ${lastName}`.trim();

          // Check if search matches first name, last name, full name, or email
          if (
            firstName.includes(searchLower) ||
            lastName.includes(searchLower) ||
            fullName.includes(searchLower) ||
            email.includes(searchLower)
          ) {
            logger.debug(
              `[ChatService.getUserChats] Match found by participant: ${fullName} (${email})`
            );
            return true;
          }

          // Check if all search terms match (for multi-word searches)
          if (searchTerms.length > 1) {
            const allTermsMatch = searchTerms.every(
              (term) =>
                firstName.includes(term) ||
                lastName.includes(term) ||
                fullName.includes(term) ||
                email.includes(term)
            );
            if (allTermsMatch) {
              logger.debug(
                `[ChatService.getUserChats] Match found by multiple search terms: ${fullName} (${email})`
              );
              return true;
            }
          }
        }

        return false;
      });

      logger.debug(
        `[ChatService.getUserChats] Filtered to ${filteredChats.length} chats after search`
      );
    }

    // Get total count before pagination
    const total = filteredChats.length;

    // Apply pagination
    const paginatedChats =
      skip !== undefined && limit !== undefined
        ? filteredChats.slice(skip, skip + limit)
        : filteredChats;

    const results = await Promise.all(
      paginatedChats.map(async (chat: any) => {
        const lastMessage = await messageRepository.findLastMessage(chat._id.toString());
        const unreadCount = await messageRepository.countUnread(chat._id.toString(), userId);
        const otherParticipant = chat.participants?.find((p: any) => p._id.toString() !== userId);

        // Ensure dates are valid ISO strings
        const updatedAt = chat.updatedAt
          ? new Date(chat.updatedAt).toISOString()
          : new Date().toISOString();
        const createdAt = chat.createdAt
          ? new Date(chat.createdAt).toISOString()
          : new Date().toISOString();

        // lastActivity should be the last message time, or updatedAt, or createdAt
        let lastActivity = updatedAt;
        if (lastMessage && lastMessage.createdAt) {
          try {
            const lastMsgDate = new Date(lastMessage.createdAt);
            if (!isNaN(lastMsgDate.getTime())) {
              lastActivity = lastMsgDate.toISOString();
            }
          } catch (e) {
            // Use updatedAt if lastMessage date is invalid
          }
        }

        // Safely extract sender information from lastMessage
        const senderInfo = lastMessage
          ? extractSenderInfo(lastMessage.senderId)
          : { senderId: '', senderName: 'Unknown' };

        return {
          id: chat._id.toString(),
          participants:
            chat.participants?.map((p: any) => {
              const firstName = (p.firstName || '').trim();
              const lastName = (p.lastName || '').trim();
              const fullName = `${firstName} ${lastName}`.trim();
              return {
                id: p._id.toString(),
                firstName: firstName,
                lastName: lastName,
                name: fullName || (p.role === 'TUTOR' ? 'Tutor' : 'User'),
                profileImage: p.profileImage || null,
                role: p.role || 'STUDENT',
              };
            }) || [],
          title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
          lastMessage: lastMessage
            ? {
                id: lastMessage._id.toString(),
                senderId: senderInfo.senderId,
                senderName: senderInfo.senderName,
                content: lastMessage.content,
                type: lastMessage.type,
                createdAt: lastMessage.createdAt
                  ? new Date(lastMessage.createdAt).toISOString()
                  : new Date().toISOString(),
                isRead: lastMessage.isRead,
              }
            : null,
          unreadCount,
          updatedAt,
          createdAt,
          lastActivity, // Add lastActivity field
        };
      })
    );
    return {
      chats: results,
      total,
    };
  }

  static async getOrCreateChat(userId: string, otherUserId: string) {
    const otherUser = await userRepository.findById(otherUserId);
    if (!otherUser) throw new AppError('User not found', 404);
    const chat: any = await chatRepository.findOrCreate(userId, otherUserId);
    const lastMessage = await messageRepository.findLastMessage(chat._id.toString());
    const unreadCount = await messageRepository.countUnread(chat._id.toString(), userId);
    const otherParticipant = chat.participants.find((p: any) => p._id.toString() !== userId);

    // Ensure dates are valid ISO strings
    const updatedAt = chat.updatedAt
      ? new Date(chat.updatedAt).toISOString()
      : new Date().toISOString();
    const createdAt = chat.createdAt
      ? new Date(chat.createdAt).toISOString()
      : new Date().toISOString();
    let lastActivity = updatedAt;
    if (lastMessage && lastMessage.createdAt) {
      try {
        const lastMsgDate = new Date(lastMessage.createdAt);
        if (!isNaN(lastMsgDate.getTime())) {
          lastActivity = lastMsgDate.toISOString();
        }
      } catch (e) {
        // Use updatedAt if lastMessage date is invalid
      }
    }

    return {
      id: chat._id.toString(),
      participants: chat.participants.map((p: any) => ({
        id: p._id.toString(),
        firstName: p.firstName,
        lastName: p.lastName,
        name: `${p.firstName} ${p.lastName}`,
        profileImage: p.profileImage || null,
        role: p.role,
      })),
      title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
      lastMessage: lastMessage
        ? (() => {
            const senderInfo = extractSenderInfo(lastMessage.senderId);
            return {
              id: lastMessage._id.toString(),
              senderId: senderInfo.senderId,
              senderName: senderInfo.senderName,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt
                ? new Date(lastMessage.createdAt).toISOString()
                : new Date().toISOString(),
              isRead: lastMessage.isRead,
            };
          })()
        : null,
      unreadCount,
      updatedAt,
      createdAt,
      lastActivity,
    };
  }

  static async createNewChat(
    userId: string,
    otherUserId: string,
    currentUserRole: string,
    title?: string,
    returnExisting: boolean = true
  ) {
    if (userId === otherUserId) {
      throw new AppError('Cannot create a chat with yourself', 400);
    }

    // Validate that current user is STUDENT
    if (currentUserRole !== 'STUDENT') {
      throw new AppError('Only students can create new chats with tutors', 403);
    }

    const otherUser: any = await userRepository.findById(otherUserId);
    if (!otherUser) {
      throw new AppError('User not found', 404);
    }

    // Validate that other user is TUTOR
    if ((otherUser as any).role !== 'TUTOR') {
      throw new AppError('You can only create chats with tutors', 403);
    }

    // Check if chat already exists
    const existingChat: any = await chatRepository.findExistingChat(userId, otherUserId);
    if (existingChat) {
      if (returnExisting) {
        // Return existing chat instead of creating new one
        await existingChat.populate('participants', 'firstName lastName profileImage role');
        const lastMessage = await messageRepository.findLastMessage(existingChat._id.toString());
        const unreadCount = await messageRepository.countUnread(
          existingChat._id.toString(),
          userId
        );
        const otherParticipant = existingChat.participants.find(
          (p: any) => p._id.toString() !== userId
        );
        // Ensure dates are valid ISO strings
        const updatedAt = existingChat.updatedAt
          ? new Date(existingChat.updatedAt).toISOString()
          : new Date().toISOString();
        const createdAt = existingChat.createdAt
          ? new Date(existingChat.createdAt).toISOString()
          : new Date().toISOString();
        let lastActivity = updatedAt;
        if (lastMessage && lastMessage.createdAt) {
          try {
            const lastMsgDate = new Date(lastMessage.createdAt);
            if (!isNaN(lastMsgDate.getTime())) {
              lastActivity = lastMsgDate.toISOString();
            }
          } catch (e) {
            // Use updatedAt if lastMessage date is invalid
          }
        }

        return {
          id: existingChat._id.toString(),
          participants: existingChat.participants.map((p: any) => ({
            id: p._id.toString(),
            firstName: p.firstName,
            lastName: p.lastName,
            name: `${p.firstName} ${p.lastName}`,
            profileImage: p.profileImage || null,
            role: p.role,
          })),
          title: existingChat.title || (otherParticipant as any)?.firstName || 'Chat',
          lastMessage: lastMessage
            ? (() => {
                const senderInfo = extractSenderInfo(lastMessage.senderId);
                return {
                  id: lastMessage._id.toString(),
                  senderId: senderInfo.senderId,
                  senderName: senderInfo.senderName,
                  content: lastMessage.content,
                  type: lastMessage.type,
                  createdAt: lastMessage.createdAt
                    ? new Date(lastMessage.createdAt).toISOString()
                    : new Date().toISOString(),
                  isRead: lastMessage.isRead,
                };
              })()
            : null,
          unreadCount,
          updatedAt,
          createdAt,
          lastActivity,
          isExisting: true,
        };
      } else {
        throw new AppError('Chat already exists with this user', 409);
      }
    }

    // Create new chat
    const chat: any = await chatRepository.createNewChat(userId, otherUserId, title);
    const lastMessage = await messageRepository.findLastMessage(chat._id.toString());
    const unreadCount = await messageRepository.countUnread(chat._id.toString(), userId);
    const otherParticipant = chat.participants.find((p: any) => p._id.toString() !== userId);

    // Ensure dates are valid ISO strings
    const updatedAt = chat.updatedAt
      ? new Date(chat.updatedAt).toISOString()
      : new Date().toISOString();
    const createdAt = chat.createdAt
      ? new Date(chat.createdAt).toISOString()
      : new Date().toISOString();
    let lastActivity = updatedAt;
    if (lastMessage && lastMessage.createdAt) {
      try {
        const lastMsgDate = new Date(lastMessage.createdAt);
        if (!isNaN(lastMsgDate.getTime())) {
          lastActivity = lastMsgDate.toISOString();
        }
      } catch (e) {
        // Use updatedAt if lastMessage date is invalid
      }
    }

    return {
      id: chat._id.toString(),
      participants: chat.participants.map((p: any) => ({
        id: p._id.toString(),
        firstName: p.firstName,
        lastName: p.lastName,
        name: `${p.firstName} ${p.lastName}`,
        profileImage: p.profileImage || null,
        role: p.role,
      })),
      title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
      lastMessage: lastMessage
        ? (() => {
            const senderInfo = extractSenderInfo(lastMessage.senderId);
            return {
              id: lastMessage._id.toString(),
              senderId: senderInfo.senderId,
              senderName: senderInfo.senderName,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt
                ? new Date(lastMessage.createdAt).toISOString()
                : new Date().toISOString(),
              isRead: lastMessage.isRead,
            };
          })()
        : null,
      unreadCount,
      updatedAt,
      createdAt,
      lastActivity,
      isExisting: false,
    };
  }

  static async getChatById(userId: string, chatId: string) {
    const chat: any = await chatRepository.isParticipant(chatId, userId);
    if (!chat) throw new AppError('Chat not found or access denied', 404);

    // Populate participants - isParticipant doesn't populate by default
    await chat.populate('participants', 'firstName lastName profileImage role');

    const lastMessage = await messageRepository.findLastMessage(chatId);
    const unreadCount = await messageRepository.countUnread(chatId, userId);
    const otherParticipant = chat.participants?.find((p: any) => p._id.toString() !== userId);

    // Ensure dates are valid ISO strings
    const updatedAt = chat.updatedAt
      ? new Date(chat.updatedAt).toISOString()
      : new Date().toISOString();
    const createdAt = chat.createdAt
      ? new Date(chat.createdAt).toISOString()
      : new Date().toISOString();
    let lastActivity = updatedAt;
    if (lastMessage && lastMessage.createdAt) {
      try {
        const lastMsgDate = new Date(lastMessage.createdAt);
        if (!isNaN(lastMsgDate.getTime())) {
          lastActivity = lastMsgDate.toISOString();
        }
      } catch (e) {
        // Use updatedAt if lastMessage date is invalid
      }
    }

    return {
      id: chat._id.toString(),
      participants:
        chat.participants?.map((p: any) => ({
          id: p._id.toString(),
          firstName: p.firstName,
          lastName: p.lastName,
          name: `${p.firstName} ${p.lastName}`,
          profileImage: p.profileImage || null,
          role: p.role,
        })) || [],
      title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
      lastMessage: lastMessage
        ? (() => {
            const senderInfo = extractSenderInfo(lastMessage.senderId);
            return {
              id: lastMessage._id.toString(),
              senderId: senderInfo.senderId,
              senderName: senderInfo.senderName,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt
                ? new Date(lastMessage.createdAt).toISOString()
                : new Date().toISOString(),
              isRead: lastMessage.isRead,
            };
          })()
        : null,
      unreadCount,
      updatedAt,
      createdAt,
      lastActivity,
    };
  }

  static async getChatMessages(
    userId: string,
    chatId: string,
    page: number,
    limit: number,
    skip?: number
  ) {
    logger.debug(
      `[ChatService.getChatMessages] Loading messages for chatId: ${chatId}, userId: ${userId}, page: ${page}, limit: ${limit}`
    );
    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) {
      logger.error(
        `[ChatService.getChatMessages] Chat not found or access denied - chatId: ${chatId}, userId: ${userId}`
      );
      throw new AppError('Chat not found or access denied', 404);
    }
    const { messages, total } = await messageRepository.getChatMessages(chatId, page, limit);
    logger.debug(
      `[ChatService.getChatMessages] Found ${messages.length} messages (total: ${total}) for chatId: ${chatId}`
    );
    const transformed = (messages as any[]).reverse().map((msg: any) => {
      // Safely extract sender information with null checks
      // msg.senderId is populated, so it should be an object with user data
      const senderData = msg.senderId && typeof msg.senderId === 'object' ? msg.senderId : {};
      const firstName = (senderData.firstName || '').trim();
      const lastName = (senderData.lastName || '').trim();
      const senderInfo = extractSenderInfo(msg.senderId);
      const senderId = senderInfo.senderId;
      const senderRole = senderData.role || 'STUDENT';
      
      // Build sender name with better fallback
      let senderName = `${firstName} ${lastName}`.trim();
      if (!senderName) {
        // Try to use senderInfo.senderName if available
        senderName = senderInfo.senderName && senderInfo.senderName !== 'Unknown' 
          ? senderInfo.senderName 
          : senderRole === 'TUTOR' 
            ? 'Tutor' 
            : 'User';
      }

      // Ensure createdAt is a valid date
      let createdAt: string;
      let timestamp: string;
      try {
        if (msg.createdAt) {
          const date = new Date(msg.createdAt);
          if (!isNaN(date.getTime())) {
            createdAt = date.toISOString();
            timestamp = date.toISOString();
          } else {
            createdAt = new Date().toISOString();
            timestamp = new Date().toISOString();
          }
        } else {
          createdAt = new Date().toISOString();
          timestamp = new Date().toISOString();
        }
      } catch (error) {
        logger.warn(
          `[ChatService.getChatMessages] Invalid date for message ${msg._id}:`,
          msg.createdAt
        );
        createdAt = new Date().toISOString();
        timestamp = new Date().toISOString();
      }

      return {
        id: msg._id ? msg._id.toString() : '',
        chatId: msg.chatId ? msg.chatId.toString() : '',
        conversationId: msg.chatId ? msg.chatId.toString() : '', // Also include conversationId for compatibility
        senderId: senderId,
        sender: {
          id: senderId,
          firstName: firstName,
          lastName: lastName,
          name: senderName,
          profileImage: senderData.profileImage || null,
          role: senderRole,
        },
        type: msg.type || 'TEXT',
        content: msg.content || '',
        fileUrl: msg.fileUrl || null,
        fileName: msg.fileName || null,
        isRead: msg.isRead || false,
        createdAt: createdAt,
        timestamp: timestamp,
      };
    });
    const result = {
      messages: transformed,
      pagination: {
        page,
        limit,
        totalMessages: total,
        totalPages: Math.ceil(total / limit),
        hasMore: (page - 1) * limit + messages.length < total,
      },
    };
    logger.debug(
      `[ChatService.getChatMessages] Returning ${transformed.length} messages with pagination info`
    );
    return result as any;
  }

  static async markMessagesAsRead(userId: string, chatId: string) {
    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) throw new AppError('Chat not found or access denied', 404);
    await messageRepository.markAsRead(chatId, userId);
  }

  static async deleteChat(userId: string, chatId: string) {
    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) throw new AppError('Chat not found or access denied', 404);
    await messageRepository.deleteByChatId(chatId);
    await (chatRepository as any).deleteById(chatId);
  }

  static async getUnreadCount(userId: string) {
    const chats: any[] = await (chatRepository as any).find(
      { participants: new Types.ObjectId(userId) } as any,
      { select: '_id' } as any
    );
    const chatIds = chats.map((c) => c._id.toString());
    const totalUnread = await messageRepository.countUnreadAcross(chatIds, userId);
    return totalUnread;
  }

  static async searchUsers(
    userId: string,
    query: string,
    currentUserRole?: string,
    page?: number,
    limit?: number,
    skip?: number
  ) {
    if (!query || query.length < 2)
      throw new AppError('Search query must be at least 2 characters', 400);

    // Build search filter
    const searchFilter: any = {
      _id: { $ne: new Types.ObjectId(userId) },
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
      ],
    };

    // If current user is STUDENT, only show TUTORs
    if (currentUserRole === 'STUDENT') {
      searchFilter.role = 'TUTOR';
    }

    // Get total count
    const total = await (userRepository as any).model.countDocuments(searchFilter);

    // Get paginated users
    let queryBuilder = (userRepository as any).model
      .find(searchFilter)
      .select('firstName lastName email profileImage role');
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);
    const users = await queryBuilder;

    const transformedUsers = (users as any[]).map((user: any) => ({
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profileImage: user.profileImage || null,
      role: user.role,
    }));

    return {
      users: transformedUsers,
      total,
    };
  }

  static async getAvailableUsers(
    userId: string,
    currentUserRole?: string,
    page?: number,
    limit?: number,
    skip?: number
  ) {
    logger.debug(
      `[ChatService.getAvailableUsers] Getting available users for userId: ${userId}, role: ${currentUserRole}, page: ${page}, limit: ${limit}`
    );

    // Build filter - exclude current user
    const userFilter: any = {
      _id: { $ne: new Types.ObjectId(userId) },
    };

    // If current user is STUDENT, only show TUTORs
    if (currentUserRole === 'STUDENT') {
      userFilter.role = 'TUTOR';
    } else if (currentUserRole === 'TUTOR') {
      // If current user is TUTOR, only show STUDENTs
      userFilter.role = 'STUDENT';
    }

    // Get total count
    const total = await (userRepository as any).model.countDocuments(userFilter);

    // Get paginated users
    let queryBuilder = (userRepository as any).model
      .find(userFilter)
      .select('firstName lastName email profileImage role')
      .sort({ firstName: 1, lastName: 1 }); // Sort alphabetically
    if (skip !== undefined) queryBuilder = queryBuilder.skip(skip);
    if (limit !== undefined) queryBuilder = queryBuilder.limit(limit);
    const users = await queryBuilder;

    logger.debug(
      `[ChatService.getAvailableUsers] Found ${users.length} available users, total: ${total}`
    );

    const transformedUsers = (users as any[]).map((user: any) => ({
      id: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
      email: user.email || '',
      profileImage: user.profileImage || null,
      role: user.role || 'STUDENT',
    }));

    return {
      users: transformedUsers,
      total,
    };
  }

  static async sendMessage(
    userId: string,
    chatId: string,
    data: { content: string; type?: string; fileUrl?: string; fileName?: string }
  ) {
    logger.debug(
      `[ChatService.sendMessage] START - userId: ${userId}, chatId: ${chatId}, content: ${data.content?.substring(0, 50)}...`
    );

    const chat = await chatRepository.isParticipant(chatId, userId);
    if (!chat) {
      logger.error(
        `[ChatService.sendMessage] ERROR - Chat not found or access denied for userId: ${userId}, chatId: ${chatId}`
      );
      throw new AppError('Chat not found or access denied', 404);
    }

    // Get chat participants to find the recipient
    const chatData: any = await (chatRepository as any).findById(chatId);
    await chatData.populate('participants', 'firstName lastName role');

    logger.debug(
      `[ChatService.sendMessage] Creating message in database - chatId: ${chatId}, senderId: ${userId}`
    );
    const message: any = await (messageRepository as any).create({
      chatId: new Types.ObjectId(chatId) as any,
      senderId: new Types.ObjectId(userId) as any,
      content: data.content as any,
      type: (data.type || 'TEXT') as any,
      fileUrl: data.fileUrl as any,
      fileName: data.fileName as any,
    } as any);
    await message.populate('senderId', 'firstName lastName profileImage role');
    await (chatRepository as any).updateById(chatId, { updatedAt: new Date() } as any);

    logger.debug(`[ChatService.sendMessage] Message created with ID: ${message._id.toString()}`);

    // Format message for socket broadcast
    const sender = message.senderId as any;
    const senderInfo = extractSenderInfo(message.senderId);
    const formattedMessage = {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      conversationId: message.chatId.toString(), // Also include conversationId for compatibility
      senderId: senderInfo.senderId,
      sender: {
        id: senderInfo.senderId,
        firstName: sender?.firstName || '',
        lastName: sender?.lastName || '',
        name:
          senderInfo.senderName !== 'Unknown'
            ? senderInfo.senderName
            : sender
              ? `${sender.firstName} ${sender.lastName}`
              : '',
        profileImage: sender?.profileImage || null,
        role: sender?.role || '',
      },
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl || null,
      fileName: message.fileName || null,
      isRead: message.isRead,
      timestamp: message.createdAt,
      createdAt: message.createdAt,
    };

    // Emit socket event to broadcast message to all participants (including sender)
    const io = getIO();
    if (io) {
      logger.debug(
        `[ChatService.sendMessage] Broadcasting message via socket to chat room: chat:${chatId}`
      );
      logger.debug(
        `[ChatService.sendMessage] Message details - id: ${formattedMessage.id}, senderId: ${formattedMessage.senderId}, senderRole: ${sender?.role}`
      );

      // Broadcast to chat room (all participants will receive it)
      io.to(`chat:${chatId}`).emit('new_message', formattedMessage);

      // Also emit to sender's personal room as confirmation (they're already in chat room, but this ensures delivery)
      // Actually, don't do this - it will cause duplicates. The chat room broadcast is enough.

      logger.debug(`[ChatService.sendMessage] Message broadcasted to chat room: chat:${chatId}`);
    } else {
      logger.warn(
        `[ChatService.sendMessage] WARNING - Socket.IO instance not available, message not broadcasted`
      );
    }

    // Send notification to tutor if message is from a student
    if (sender.role === 'STUDENT' && chatData.participants) {
      const tutor = chatData.participants.find(
        (p: any) => p.role === 'TUTOR' && p._id.toString() !== userId
      );
      if (tutor) {
        logger.debug(
          `[ChatService.sendMessage] Sending notification to tutor: ${tutor._id.toString()}`
        );
        if (io) {
          await sendNotificationToUser(io, tutor._id.toString(), {
            type: 'message_received',
            title: `💬 New Message from Student : ${sender.firstName} ${sender.lastName}`,
            message: `${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
            data: {
              chatId: chatId,
              messageId: message._id.toString(),
              senderId: userId,
              senderName: `${sender.firstName} ${sender.lastName}`,
              content: data.content.substring(0, 100),
            },
          });
        }
      }
    }

    logger.debug(
      `[ChatService.sendMessage] COMPLETE - Message ${message._id.toString()} sent successfully`
    );

    // Use the already extracted senderInfo from formattedMessage
    const returnSenderInfo = extractSenderInfo(message.senderId);
    const returnSender = message.senderId as any;

    return {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      senderId: returnSenderInfo.senderId,
      sender: {
        id: returnSenderInfo.senderId,
        firstName: returnSender?.firstName || '',
        lastName: returnSender?.lastName || '',
        name:
          returnSenderInfo.senderName !== 'Unknown'
            ? returnSenderInfo.senderName
            : returnSender
              ? `${returnSender.firstName} ${returnSender.lastName}`
              : '',
        profileImage: returnSender?.profileImage || null,
        role: returnSender?.role || '',
      },
      type: message.type,
      content: message.content,
      fileUrl: message.fileUrl || null,
      fileName: message.fileName || null,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }
}

export default ChatService;
