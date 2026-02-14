"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const mongoose_1 = require("mongoose");
const ChatRepository_1 = __importDefault(require("../repositories/ChatRepository"));
const MessageRepository_1 = __importDefault(require("../repositories/MessageRepository"));
const UserRepository_1 = __importDefault(require("../repositories/UserRepository"));
const errorHandler_1 = require("../middleware/errorHandler");
const socket_1 = require("../socket");
const socket_2 = require("../socket");
const logger_1 = require("../utils/logger");
/**
 * Helper function to safely extract sender ID and name from a message
 */
function extractSenderInfo(senderId) {
    let id = '';
    let name = 'Unknown';
    if (!senderId) {
        return { senderId: '', senderName: 'Unknown' };
    }
    // Handle populated senderId (user object) or ObjectId
    if (typeof senderId === 'object' && senderId !== null) {
        // If populated, it's a user object with _id, firstName, lastName
        if (senderId._id) {
            id = senderId._id.toString();
            name = `${senderId.firstName || ''} ${senderId.lastName || ''}`.trim() || 'Unknown';
        }
        else if (senderId.toString) {
            // It's an ObjectId
            id = senderId.toString();
            name = 'Unknown';
        }
    }
    else if (typeof senderId === 'string') {
        id = senderId;
        name = 'Unknown';
    }
    return { senderId: id, senderName: name };
}
class ChatService {
    static async getUserChats(userId, search, page, limit, skip) {
        logger_1.logger.debug(`[ChatService.getUserChats] Loading chats for userId: ${userId}, search: ${search || 'none'}, page: ${page}, limit: ${limit}`);
        const chats = await ChatRepository_1.default.findUserChats(userId); // Always fetch all chats, filter in service
        logger_1.logger.debug(`[ChatService.getUserChats] Found ${chats.length} chats from repository`);
        // Filter by participant names if search is provided (after population)
        let filteredChats = chats;
        if (search && search.trim()) {
            const searchLower = search.trim().toLowerCase();
            const searchTerms = searchLower.split(/\s+/).filter((term) => term.length > 0); // Split into individual words
            filteredChats = chats.filter((chat) => {
                // Check title
                if (chat.title && chat.title.toLowerCase().includes(searchLower)) {
                    logger_1.logger.debug('Chat match found by title', { chatId: chat._id?.toString(), title: chat.title });
                    return true;
                }
                // Check participant names (excluding current user)
                const otherParticipants = chat.participants?.filter((p) => p._id && p._id.toString() !== userId) || [];
                for (const participant of otherParticipants) {
                    const firstName = (participant.firstName || '').toLowerCase().trim();
                    const lastName = (participant.lastName || '').toLowerCase().trim();
                    const email = (participant.email || '').toLowerCase().trim();
                    const fullName = `${firstName} ${lastName}`.trim();
                    // Check if search matches first name, last name, full name, or email
                    if (firstName.includes(searchLower) ||
                        lastName.includes(searchLower) ||
                        fullName.includes(searchLower) ||
                        email.includes(searchLower)) {
                        logger_1.logger.debug(`[ChatService.getUserChats] Match found by participant: ${fullName} (${email})`);
                        return true;
                    }
                    // Check if all search terms match (for multi-word searches)
                    if (searchTerms.length > 1) {
                        const allTermsMatch = searchTerms.every((term) => firstName.includes(term) ||
                            lastName.includes(term) ||
                            fullName.includes(term) ||
                            email.includes(term));
                        if (allTermsMatch) {
                            logger_1.logger.debug(`[ChatService.getUserChats] Match found by multiple search terms: ${fullName} (${email})`);
                            return true;
                        }
                    }
                }
                return false;
            });
            logger_1.logger.debug(`[ChatService.getUserChats] Filtered to ${filteredChats.length} chats after search`);
        }
        // Get total count before pagination
        const total = filteredChats.length;
        // Apply pagination
        const paginatedChats = skip !== undefined && limit !== undefined
            ? filteredChats.slice(skip, skip + limit)
            : filteredChats;
        const results = await Promise.all(paginatedChats.map(async (chat) => {
            const lastMessage = await MessageRepository_1.default.findLastMessage(chat._id.toString());
            const unreadCount = await MessageRepository_1.default.countUnread(chat._id.toString(), userId);
            const otherParticipant = chat.participants?.find((p) => p._id.toString() !== userId);
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
                }
                catch (e) {
                    // Use updatedAt if lastMessage date is invalid
                }
            }
            // Safely extract sender information from lastMessage
            const senderInfo = lastMessage
                ? extractSenderInfo(lastMessage.senderId)
                : { senderId: '', senderName: 'Unknown' };
            return {
                id: chat._id.toString(),
                participants: chat.participants?.map((p) => {
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
                title: chat.title || otherParticipant?.firstName || 'Chat',
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
        }));
        return {
            chats: results,
            total,
        };
    }
    static async getOrCreateChat(userId, otherUserId) {
        const otherUser = await UserRepository_1.default.findById(otherUserId);
        if (!otherUser)
            throw new errorHandler_1.AppError('User not found', 404);
        const chat = await ChatRepository_1.default.findOrCreate(userId, otherUserId);
        const lastMessage = await MessageRepository_1.default.findLastMessage(chat._id.toString());
        const unreadCount = await MessageRepository_1.default.countUnread(chat._id.toString(), userId);
        const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);
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
            }
            catch (e) {
                // Use updatedAt if lastMessage date is invalid
            }
        }
        return {
            id: chat._id.toString(),
            participants: chat.participants.map((p) => ({
                id: p._id.toString(),
                firstName: p.firstName,
                lastName: p.lastName,
                name: `${p.firstName} ${p.lastName}`,
                profileImage: p.profileImage || null,
                role: p.role,
            })),
            title: chat.title || otherParticipant?.firstName || 'Chat',
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
    static async createNewChat(userId, otherUserId, currentUserRole, title, returnExisting = true) {
        if (userId === otherUserId) {
            throw new errorHandler_1.AppError('Cannot create a chat with yourself', 400);
        }
        // Validate that current user is STUDENT
        if (currentUserRole !== 'STUDENT') {
            throw new errorHandler_1.AppError('Only students can create new chats with tutors', 403);
        }
        const otherUser = await UserRepository_1.default.findById(otherUserId);
        if (!otherUser) {
            throw new errorHandler_1.AppError('User not found', 404);
        }
        // Validate that other user is TUTOR
        if (otherUser.role !== 'TUTOR') {
            throw new errorHandler_1.AppError('You can only create chats with tutors', 403);
        }
        // Check if chat already exists
        const existingChat = await ChatRepository_1.default.findExistingChat(userId, otherUserId);
        if (existingChat) {
            if (returnExisting) {
                // Return existing chat instead of creating new one
                await existingChat.populate('participants', 'firstName lastName profileImage role');
                const lastMessage = await MessageRepository_1.default.findLastMessage(existingChat._id.toString());
                const unreadCount = await MessageRepository_1.default.countUnread(existingChat._id.toString(), userId);
                const otherParticipant = existingChat.participants.find((p) => p._id.toString() !== userId);
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
                    }
                    catch (e) {
                        // Use updatedAt if lastMessage date is invalid
                    }
                }
                return {
                    id: existingChat._id.toString(),
                    participants: existingChat.participants.map((p) => ({
                        id: p._id.toString(),
                        firstName: p.firstName,
                        lastName: p.lastName,
                        name: `${p.firstName} ${p.lastName}`,
                        profileImage: p.profileImage || null,
                        role: p.role,
                    })),
                    title: existingChat.title || otherParticipant?.firstName || 'Chat',
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
            }
            else {
                throw new errorHandler_1.AppError('Chat already exists with this user', 409);
            }
        }
        // Create new chat
        const chat = await ChatRepository_1.default.createNewChat(userId, otherUserId, title);
        const lastMessage = await MessageRepository_1.default.findLastMessage(chat._id.toString());
        const unreadCount = await MessageRepository_1.default.countUnread(chat._id.toString(), userId);
        const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);
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
            }
            catch (e) {
                // Use updatedAt if lastMessage date is invalid
            }
        }
        return {
            id: chat._id.toString(),
            participants: chat.participants.map((p) => ({
                id: p._id.toString(),
                firstName: p.firstName,
                lastName: p.lastName,
                name: `${p.firstName} ${p.lastName}`,
                profileImage: p.profileImage || null,
                role: p.role,
            })),
            title: chat.title || otherParticipant?.firstName || 'Chat',
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
    static async getChatById(userId, chatId) {
        const chat = await ChatRepository_1.default.isParticipant(chatId, userId);
        if (!chat)
            throw new errorHandler_1.AppError('Chat not found or access denied', 404);
        // Populate participants - isParticipant doesn't populate by default
        await chat.populate('participants', 'firstName lastName profileImage role');
        const lastMessage = await MessageRepository_1.default.findLastMessage(chatId);
        const unreadCount = await MessageRepository_1.default.countUnread(chatId, userId);
        const otherParticipant = chat.participants?.find((p) => p._id.toString() !== userId);
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
            }
            catch (e) {
                // Use updatedAt if lastMessage date is invalid
            }
        }
        return {
            id: chat._id.toString(),
            participants: chat.participants?.map((p) => ({
                id: p._id.toString(),
                firstName: p.firstName,
                lastName: p.lastName,
                name: `${p.firstName} ${p.lastName}`,
                profileImage: p.profileImage || null,
                role: p.role,
            })) || [],
            title: chat.title || otherParticipant?.firstName || 'Chat',
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
    static async getChatMessages(userId, chatId, page, limit, skip) {
        logger_1.logger.debug(`[ChatService.getChatMessages] Loading messages for chatId: ${chatId}, userId: ${userId}, page: ${page}, limit: ${limit}`);
        const chat = await ChatRepository_1.default.isParticipant(chatId, userId);
        if (!chat) {
            logger_1.logger.error(`[ChatService.getChatMessages] Chat not found or access denied - chatId: ${chatId}, userId: ${userId}`);
            throw new errorHandler_1.AppError('Chat not found or access denied', 404);
        }
        const { messages, total } = await MessageRepository_1.default.getChatMessages(chatId, page, limit);
        logger_1.logger.debug(`[ChatService.getChatMessages] Found ${messages.length} messages (total: ${total}) for chatId: ${chatId}`);
        const transformed = messages.reverse().map((msg) => {
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
            let createdAt;
            let timestamp;
            try {
                if (msg.createdAt) {
                    const date = new Date(msg.createdAt);
                    if (!isNaN(date.getTime())) {
                        createdAt = date.toISOString();
                        timestamp = date.toISOString();
                    }
                    else {
                        createdAt = new Date().toISOString();
                        timestamp = new Date().toISOString();
                    }
                }
                else {
                    createdAt = new Date().toISOString();
                    timestamp = new Date().toISOString();
                }
            }
            catch (error) {
                logger_1.logger.warn(`[ChatService.getChatMessages] Invalid date for message ${msg._id}:`, msg.createdAt);
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
        logger_1.logger.debug(`[ChatService.getChatMessages] Returning ${transformed.length} messages with pagination info`);
        return result;
    }
    static async markMessagesAsRead(userId, chatId) {
        const chat = await ChatRepository_1.default.isParticipant(chatId, userId);
        if (!chat)
            throw new errorHandler_1.AppError('Chat not found or access denied', 404);
        await MessageRepository_1.default.markAsRead(chatId, userId);
    }
    static async deleteChat(userId, chatId) {
        const chat = await ChatRepository_1.default.isParticipant(chatId, userId);
        if (!chat)
            throw new errorHandler_1.AppError('Chat not found or access denied', 404);
        await MessageRepository_1.default.deleteByChatId(chatId);
        await ChatRepository_1.default.deleteById(chatId);
    }
    static async getUnreadCount(userId) {
        const chats = await ChatRepository_1.default.find({ participants: new mongoose_1.Types.ObjectId(userId) }, { select: '_id' });
        const chatIds = chats.map((c) => c._id.toString());
        const totalUnread = await MessageRepository_1.default.countUnreadAcross(chatIds, userId);
        return totalUnread;
    }
    static async searchUsers(userId, query, currentUserRole, page, limit, skip) {
        if (!query || query.length < 2)
            throw new errorHandler_1.AppError('Search query must be at least 2 characters', 400);
        // Build search filter
        const searchFilter = {
            _id: { $ne: new mongoose_1.Types.ObjectId(userId) },
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
        const total = await UserRepository_1.default.model.countDocuments(searchFilter);
        // Get paginated users
        let queryBuilder = UserRepository_1.default.model
            .find(searchFilter)
            .select('firstName lastName email profileImage role');
        if (skip !== undefined)
            queryBuilder = queryBuilder.skip(skip);
        if (limit !== undefined)
            queryBuilder = queryBuilder.limit(limit);
        const users = await queryBuilder;
        const transformedUsers = users.map((user) => ({
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
    static async getAvailableUsers(userId, currentUserRole, page, limit, skip) {
        logger_1.logger.debug(`[ChatService.getAvailableUsers] Getting available users for userId: ${userId}, role: ${currentUserRole}, page: ${page}, limit: ${limit}`);
        // Build filter - exclude current user
        const userFilter = {
            _id: { $ne: new mongoose_1.Types.ObjectId(userId) },
        };
        // If current user is STUDENT, only show TUTORs
        if (currentUserRole === 'STUDENT') {
            userFilter.role = 'TUTOR';
        }
        else if (currentUserRole === 'TUTOR') {
            // If current user is TUTOR, only show STUDENTs
            userFilter.role = 'STUDENT';
        }
        // Get total count
        const total = await UserRepository_1.default.model.countDocuments(userFilter);
        // Get paginated users
        let queryBuilder = UserRepository_1.default.model
            .find(userFilter)
            .select('firstName lastName email profileImage role')
            .sort({ firstName: 1, lastName: 1 }); // Sort alphabetically
        if (skip !== undefined)
            queryBuilder = queryBuilder.skip(skip);
        if (limit !== undefined)
            queryBuilder = queryBuilder.limit(limit);
        const users = await queryBuilder;
        logger_1.logger.debug(`[ChatService.getAvailableUsers] Found ${users.length} available users, total: ${total}`);
        const transformedUsers = users.map((user) => ({
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
    static async sendMessage(userId, chatId, data) {
        logger_1.logger.debug(`[ChatService.sendMessage] START - userId: ${userId}, chatId: ${chatId}, content: ${data.content?.substring(0, 50)}...`);
        const chat = await ChatRepository_1.default.isParticipant(chatId, userId);
        if (!chat) {
            logger_1.logger.error(`[ChatService.sendMessage] ERROR - Chat not found or access denied for userId: ${userId}, chatId: ${chatId}`);
            throw new errorHandler_1.AppError('Chat not found or access denied', 404);
        }
        // Get chat participants to find the recipient
        const chatData = await ChatRepository_1.default.findById(chatId);
        await chatData.populate('participants', 'firstName lastName role');
        logger_1.logger.debug(`[ChatService.sendMessage] Creating message in database - chatId: ${chatId}, senderId: ${userId}`);
        const message = await MessageRepository_1.default.create({
            chatId: new mongoose_1.Types.ObjectId(chatId),
            senderId: new mongoose_1.Types.ObjectId(userId),
            content: data.content,
            type: (data.type || 'TEXT'),
            fileUrl: data.fileUrl,
            fileName: data.fileName,
        });
        await message.populate('senderId', 'firstName lastName profileImage role');
        await ChatRepository_1.default.updateById(chatId, { updatedAt: new Date() });
        logger_1.logger.debug(`[ChatService.sendMessage] Message created with ID: ${message._id.toString()}`);
        // Format message for socket broadcast
        const sender = message.senderId;
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
                name: senderInfo.senderName !== 'Unknown'
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
        const io = (0, socket_1.getIO)();
        if (io) {
            logger_1.logger.debug(`[ChatService.sendMessage] Broadcasting message via socket to chat room: chat:${chatId}`);
            logger_1.logger.debug(`[ChatService.sendMessage] Message details - id: ${formattedMessage.id}, senderId: ${formattedMessage.senderId}, senderRole: ${sender?.role}`);
            // Broadcast to chat room (all participants will receive it)
            io.to(`chat:${chatId}`).emit('new_message', formattedMessage);
            // Also emit to sender's personal room as confirmation (they're already in chat room, but this ensures delivery)
            // Actually, don't do this - it will cause duplicates. The chat room broadcast is enough.
            logger_1.logger.debug(`[ChatService.sendMessage] Message broadcasted to chat room: chat:${chatId}`);
        }
        else {
            logger_1.logger.warn(`[ChatService.sendMessage] WARNING - Socket.IO instance not available, message not broadcasted`);
        }
        // Send notification to tutor if message is from a student
        if (sender.role === 'STUDENT' && chatData.participants) {
            const tutor = chatData.participants.find((p) => p.role === 'TUTOR' && p._id.toString() !== userId);
            if (tutor) {
                logger_1.logger.debug(`[ChatService.sendMessage] Sending notification to tutor: ${tutor._id.toString()}`);
                if (io) {
                    await (0, socket_2.sendNotificationToUser)(io, tutor._id.toString(), {
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
        logger_1.logger.debug(`[ChatService.sendMessage] COMPLETE - Message ${message._id.toString()} sent successfully`);
        // Use the already extracted senderInfo from formattedMessage
        const returnSenderInfo = extractSenderInfo(message.senderId);
        const returnSender = message.senderId;
        return {
            id: message._id.toString(),
            chatId: message.chatId.toString(),
            senderId: returnSenderInfo.senderId,
            sender: {
                id: returnSenderInfo.senderId,
                firstName: returnSender?.firstName || '',
                lastName: returnSender?.lastName || '',
                name: returnSenderInfo.senderName !== 'Unknown'
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
exports.ChatService = ChatService;
exports.default = ChatService;
//# sourceMappingURL=chatService.js.map