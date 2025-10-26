"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const models_1 = require("../models");
const errorHandler_1 = require("../middleware/errorHandler");
class ChatController {
    // Get all chats for the current user
    static async getUserChats(req, res) {
        try {
            const userId = req.user.id;
            const chats = await models_1.Chat.find({
                participants: userId
            })
                .populate('participants', 'firstName lastName profileImage role')
                .sort({ updatedAt: -1 });
            // Get last message and unread count for each chat
            const chatsWithDetails = await Promise.all(chats.map(async (chat) => {
                // Get last message
                const lastMessage = await models_1.Message.findOne({ chatId: chat._id })
                    .sort({ createdAt: -1 })
                    .populate('senderId', 'firstName lastName');
                // Get unread count
                const unreadCount = await models_1.Message.countDocuments({
                    chatId: chat._id,
                    senderId: { $ne: userId },
                    isRead: false
                });
                // Get the other participant (for one-on-one chats)
                const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);
                return {
                    id: chat._id.toString(),
                    participants: chat.participants.map((p) => ({
                        id: p._id.toString(),
                        firstName: p.firstName,
                        lastName: p.lastName,
                        name: `${p.firstName} ${p.lastName}`,
                        profileImage: p.profileImage || null,
                        role: p.role
                    })),
                    title: chat.title || otherParticipant?.firstName || 'Chat',
                    lastMessage: lastMessage ? {
                        id: lastMessage._id.toString(),
                        senderId: lastMessage.senderId.toString(),
                        senderName: `${lastMessage.senderId.firstName} ${lastMessage.senderId.lastName}`,
                        content: lastMessage.content,
                        type: lastMessage.type,
                        createdAt: lastMessage.createdAt,
                        isRead: lastMessage.isRead
                    } : null,
                    unreadCount,
                    updatedAt: chat.updatedAt,
                    createdAt: chat.createdAt
                };
            }));
            res.json({ chats: chatsWithDetails });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch chats', 500);
        }
    }
    // Get or create a chat with another user
    static async getOrCreateChat(req, res) {
        try {
            const userId = req.user.id;
            const { otherUserId } = req.body;
            if (!otherUserId) {
                throw new errorHandler_1.AppError('Other user ID is required', 400);
            }
            // Verify the other user exists
            const otherUser = await models_1.User.findById(otherUserId);
            if (!otherUser) {
                throw new errorHandler_1.AppError('User not found', 404);
            }
            // Find existing chat or create new one
            let chat = await models_1.Chat.findOne({
                participants: { $all: [userId, otherUserId], $size: 2 }
            }).populate('participants', 'firstName lastName profileImage role');
            if (!chat) {
                chat = await models_1.Chat.create({
                    participants: [userId, otherUserId]
                });
                await chat.populate('participants', 'firstName lastName profileImage role');
            }
            // Get last message and unread count
            const lastMessage = await models_1.Message.findOne({ chatId: chat._id })
                .sort({ createdAt: -1 })
                .populate('senderId', 'firstName lastName');
            const unreadCount = await models_1.Message.countDocuments({
                chatId: chat._id,
                senderId: { $ne: userId },
                isRead: false
            });
            const otherParticipant = chat.participants.find((p) => p._id.toString() !== userId);
            const chatData = {
                id: chat._id.toString(),
                participants: chat.participants.map((p) => ({
                    id: p._id.toString(),
                    firstName: p.firstName,
                    lastName: p.lastName,
                    name: `${p.firstName} ${p.lastName}`,
                    profileImage: p.profileImage || null,
                    role: p.role
                })),
                title: chat.title || otherParticipant?.firstName || 'Chat',
                lastMessage: lastMessage ? {
                    id: lastMessage._id.toString(),
                    senderId: lastMessage.senderId.toString(),
                    senderName: `${lastMessage.senderId.firstName} ${lastMessage.senderId.lastName}`,
                    content: lastMessage.content,
                    type: lastMessage.type,
                    createdAt: lastMessage.createdAt,
                    isRead: lastMessage.isRead
                } : null,
                unreadCount,
                updatedAt: chat.updatedAt,
                createdAt: chat.createdAt
            };
            res.json({ chat: chatData });
        }
        catch (error) {
            throw error;
        }
    }
    // Get messages for a specific chat
    static async getChatMessages(req, res) {
        try {
            const userId = req.user.id;
            const { chatId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            // Verify user is participant in this chat
            const chat = await models_1.Chat.findOne({
                _id: chatId,
                participants: userId
            });
            if (!chat) {
                throw new errorHandler_1.AppError('Chat not found or access denied', 404);
            }
            const skip = (page - 1) * limit;
            const messages = await models_1.Message.find({ chatId })
                .populate('senderId', 'firstName lastName profileImage role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const totalMessages = await models_1.Message.countDocuments({ chatId });
            const transformedMessages = messages.reverse().map(msg => ({
                id: msg._id.toString(),
                chatId: msg.chatId.toString(),
                senderId: msg.senderId.toString(),
                sender: {
                    id: msg.senderId._id.toString(),
                    firstName: msg.senderId.firstName,
                    lastName: msg.senderId.lastName,
                    name: `${msg.senderId.firstName} ${msg.senderId.lastName}`,
                    profileImage: msg.senderId.profileImage || null,
                    role: msg.senderId.role
                },
                type: msg.type,
                content: msg.content,
                fileUrl: msg.fileUrl || null,
                fileName: msg.fileName || null,
                isRead: msg.isRead,
                createdAt: msg.createdAt
            }));
            res.json({
                messages: transformedMessages,
                pagination: {
                    page,
                    limit,
                    totalMessages,
                    totalPages: Math.ceil(totalMessages / limit),
                    hasMore: skip + messages.length < totalMessages
                }
            });
        }
        catch (error) {
            throw error;
        }
    }
    // Mark messages as read
    static async markMessagesAsRead(req, res) {
        try {
            const userId = req.user.id;
            const { chatId } = req.params;
            // Verify user is participant in this chat
            const chat = await models_1.Chat.findOne({
                _id: chatId,
                participants: userId
            });
            if (!chat) {
                throw new errorHandler_1.AppError('Chat not found or access denied', 404);
            }
            // Mark all unread messages from other users as read
            await models_1.Message.updateMany({
                chatId,
                senderId: { $ne: userId },
                isRead: false
            }, { isRead: true });
            res.json({ success: true, message: 'Messages marked as read' });
        }
        catch (error) {
            throw error;
        }
    }
    // Delete a chat
    static async deleteChat(req, res) {
        try {
            const userId = req.user.id;
            const { chatId } = req.params;
            // Verify user is participant in this chat
            const chat = await models_1.Chat.findOne({
                _id: chatId,
                participants: userId
            });
            if (!chat) {
                throw new errorHandler_1.AppError('Chat not found or access denied', 404);
            }
            // Delete all messages in this chat
            await models_1.Message.deleteMany({ chatId });
            // Delete the chat
            await models_1.Chat.findByIdAndDelete(chatId);
            res.json({ success: true, message: 'Chat deleted successfully' });
        }
        catch (error) {
            throw error;
        }
    }
    // Get unread message count across all chats
    static async getUnreadCount(req, res) {
        try {
            const userId = req.user.id;
            // Get all chats for this user
            const chats = await models_1.Chat.find({
                participants: userId
            }).select('_id');
            const chatIds = chats.map(chat => chat._id);
            // Count unread messages across all chats
            const totalUnread = await models_1.Message.countDocuments({
                chatId: { $in: chatIds },
                senderId: { $ne: userId },
                isRead: false
            });
            res.json({ unreadCount: totalUnread });
        }
        catch (error) {
            throw new errorHandler_1.AppError('Failed to fetch unread count', 500);
        }
    }
    // Search users to start a chat with
    static async searchUsers(req, res) {
        try {
            const userId = req.user.id;
            const { query } = req.query;
            if (!query || query.length < 2) {
                throw new errorHandler_1.AppError('Search query must be at least 2 characters', 400);
            }
            const users = await models_1.User.find({
                _id: { $ne: userId },
                $or: [
                    { firstName: { $regex: query, $options: 'i' } },
                    { lastName: { $regex: query, $options: 'i' } },
                    { email: { $regex: query, $options: 'i' } }
                ]
            })
                .select('firstName lastName email profileImage role')
                .limit(20);
            const transformedUsers = users.map(user => ({
                id: user._id.toString(),
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                profileImage: user.profileImage || null,
                role: user.role
            }));
            res.json({ users: transformedUsers });
        }
        catch (error) {
            throw error;
        }
    }
    // Send a message via HTTP (alternative to Socket.IO)
    static async sendMessage(req, res) {
        try {
            const userId = req.user.id;
            const { chatId } = req.params;
            const { content, type, fileUrl, fileName } = req.body;
            // Verify user is participant in this chat
            const chat = await models_1.Chat.findOne({
                _id: chatId,
                participants: userId
            });
            if (!chat) {
                throw new errorHandler_1.AppError('Chat not found or access denied', 404);
            }
            // Create message
            const message = await models_1.Message.create({
                chatId,
                senderId: userId,
                content,
                type: type || 'TEXT',
                fileUrl,
                fileName
            });
            await message.populate('senderId', 'firstName lastName profileImage role');
            // Update chat's updatedAt timestamp
            await models_1.Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });
            const transformedMessage = {
                id: message._id.toString(),
                chatId: message.chatId.toString(),
                senderId: message.senderId.toString(),
                sender: {
                    id: message.senderId._id.toString(),
                    firstName: message.senderId.firstName,
                    lastName: message.senderId.lastName,
                    name: `${message.senderId.firstName} ${message.senderId.lastName}`,
                    profileImage: message.senderId.profileImage || null,
                    role: message.senderId.role
                },
                type: message.type,
                content: message.content,
                fileUrl: message.fileUrl || null,
                fileName: message.fileName || null,
                isRead: message.isRead,
                createdAt: message.createdAt
            };
            res.json({ message: transformedMessage });
        }
        catch (error) {
            throw error;
        }
    }
}
exports.ChatController = ChatController;
//# sourceMappingURL=chatController.js.map