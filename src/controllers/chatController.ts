import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Chat, Message, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

export class ChatController {
  // Get all chats for the current user
  static async getUserChats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      const chats = await Chat.find({
        participants: userId
      })
        .populate('participants', 'firstName lastName profileImage role')
        .sort({ updatedAt: -1 });

      // Get last message and unread count for each chat
      const chatsWithDetails = await Promise.all(
        chats.map(async (chat) => {
          // Get last message
          const lastMessage = await Message.findOne({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .populate('senderId', 'firstName lastName');

          // Get unread count
          const unreadCount = await Message.countDocuments({
            chatId: chat._id,
            senderId: { $ne: userId },
            isRead: false
          });

          // Get the other participant (for one-on-one chats)
          const otherParticipant = chat.participants.find(
            (p: any) => p._id.toString() !== userId
          );

          return {
            id: chat._id.toString(),
            participants: chat.participants.map((p: any) => ({
              id: p._id.toString(),
              firstName: p.firstName,
              lastName: p.lastName,
              name: `${p.firstName} ${p.lastName}`,
              profileImage: p.profileImage || null,
              role: p.role
            })),
            title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
            lastMessage: lastMessage ? {
              id: lastMessage._id.toString(),
              senderId: lastMessage.senderId.toString(),
              senderName: `${(lastMessage.senderId as any).firstName} ${(lastMessage.senderId as any).lastName}`,
              content: lastMessage.content,
              type: lastMessage.type,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead
            } : null,
            unreadCount,
            updatedAt: chat.updatedAt,
            createdAt: chat.createdAt
          };
        })
      );

      res.json({ chats: chatsWithDetails });
    } catch (error) {
      throw new AppError('Failed to fetch chats', 500);
    }
  }

  // Get or create a chat with another user
  static async getOrCreateChat(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { otherUserId } = req.body;

      if (!otherUserId) {
        throw new AppError('Other user ID is required', 400);
      }

      // Verify the other user exists
      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        throw new AppError('User not found', 404);
      }

      // Find existing chat or create new one
      let chat = await Chat.findOne({
        participants: { $all: [userId, otherUserId], $size: 2 }
      }).populate('participants', 'firstName lastName profileImage role');

      if (!chat) {
        chat = await Chat.create({
          participants: [userId, otherUserId]
        });

        await chat.populate('participants', 'firstName lastName profileImage role');
      }

      // Get last message and unread count
      const lastMessage = await Message.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .populate('senderId', 'firstName lastName');

      const unreadCount = await Message.countDocuments({
        chatId: chat._id,
        senderId: { $ne: userId },
        isRead: false
      });

      const otherParticipant = chat.participants.find(
        (p: any) => p._id.toString() !== userId
      );

      const chatData = {
        id: chat._id.toString(),
        participants: chat.participants.map((p: any) => ({
          id: p._id.toString(),
          firstName: p.firstName,
          lastName: p.lastName,
          name: `${p.firstName} ${p.lastName}`,
          profileImage: p.profileImage || null,
          role: p.role
        })),
        title: chat.title || (otherParticipant as any)?.firstName || 'Chat',
        lastMessage: lastMessage ? {
          id: lastMessage._id.toString(),
          senderId: lastMessage.senderId.toString(),
          senderName: `${(lastMessage.senderId as any).firstName} ${(lastMessage.senderId as any).lastName}`,
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
    } catch (error) {
      throw error;
    }
  }

  // Get messages for a specific chat
  static async getChatMessages(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { chatId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // Verify user is participant in this chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        throw new AppError('Chat not found or access denied', 404);
      }

      const skip = (page - 1) * limit;

      const messages = await Message.find({ chatId })
        .populate('senderId', 'firstName lastName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalMessages = await Message.countDocuments({ chatId });

      const transformedMessages = messages.reverse().map(msg => ({
        id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        senderId: msg.senderId.toString(),
        sender: {
          id: (msg.senderId as any)._id.toString(),
          firstName: (msg.senderId as any).firstName,
          lastName: (msg.senderId as any).lastName,
          name: `${(msg.senderId as any).firstName} ${(msg.senderId as any).lastName}`,
          profileImage: (msg.senderId as any).profileImage || null,
          role: (msg.senderId as any).role
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
    } catch (error) {
      throw error;
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { chatId } = req.params;

      // Verify user is participant in this chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        throw new AppError('Chat not found or access denied', 404);
      }

      // Mark all unread messages from other users as read
      await Message.updateMany(
        {
          chatId,
          senderId: { $ne: userId },
          isRead: false
        },
        { isRead: true }
      );

      res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
      throw error;
    }
  }

  // Delete a chat
  static async deleteChat(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { chatId } = req.params;

      // Verify user is participant in this chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        throw new AppError('Chat not found or access denied', 404);
      }

      // Delete all messages in this chat
      await Message.deleteMany({ chatId });

      // Delete the chat
      await Chat.findByIdAndDelete(chatId);

      res.json({ success: true, message: 'Chat deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  // Get unread message count across all chats
  static async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;

      // Get all chats for this user
      const chats = await Chat.find({
        participants: userId
      }).select('_id');

      const chatIds = chats.map(chat => chat._id);

      // Count unread messages across all chats
      const totalUnread = await Message.countDocuments({
        chatId: { $in: chatIds },
        senderId: { $ne: userId },
        isRead: false
      });

      res.json({ unreadCount: totalUnread });
    } catch (error) {
      throw new AppError('Failed to fetch unread count', 500);
    }
  }

  // Search users to start a chat with
  static async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { query } = req.query;

      if (!query || (query as string).length < 2) {
        throw new AppError('Search query must be at least 2 characters', 400);
      }

      const users = await User.find({
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
    } catch (error) {
      throw error;
    }
  }

  // Send a message via HTTP (alternative to Socket.IO)
  static async sendMessage(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { chatId } = req.params;
      const { content, type, fileUrl, fileName } = req.body;

      // Verify user is participant in this chat
      const chat = await Chat.findOne({
        _id: chatId,
        participants: userId
      });

      if (!chat) {
        throw new AppError('Chat not found or access denied', 404);
      }

      // Create message
      const message = await Message.create({
        chatId,
        senderId: userId,
        content,
        type: type || 'TEXT',
        fileUrl,
        fileName
      });

      await message.populate('senderId', 'firstName lastName profileImage role');

      // Update chat's updatedAt timestamp
      await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

      const transformedMessage = {
        id: message._id.toString(),
        chatId: message.chatId.toString(),
        senderId: message.senderId.toString(),
        sender: {
          id: (message.senderId as any)._id.toString(),
          firstName: (message.senderId as any).firstName,
          lastName: (message.senderId as any).lastName,
          name: `${(message.senderId as any).firstName} ${(message.senderId as any).lastName}`,
          profileImage: (message.senderId as any).profileImage || null,
          role: (message.senderId as any).role
        },
        type: message.type,
        content: message.content,
        fileUrl: message.fileUrl || null,
        fileName: message.fileName || null,
        isRead: message.isRead,
        createdAt: message.createdAt
      };

      res.json({ message: transformedMessage });
    } catch (error) {
      throw error;
    }
  }
}
