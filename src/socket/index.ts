import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, Chat, Message, Notification } from '../models';
import { logger } from '../utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Store for tracking online users
const onlineUsers = new Map<
  string,
  { socketId: string; status: 'online' | 'away' | 'offline'; lastSeen: Date }
>();

// Store the io instance
let ioInstance: Server | null = null;

// Export function to get the io instance
export const getIO = (): Server | null => {
  return ioInstance;
};

export const setupSocketIO = (io: Server) => {
  ioInstance = io;
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

      // Verify user exists
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info('User connected via Socket.IO', {
      userId: socket.userId,
      socketId: socket.id,
      transport: socket.conn.transport.name,
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Track user as online
    if (socket.userId) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date(),
      });

      // Broadcast online status to all connected clients
      io.emit('user_online_status', {
        userId: socket.userId,
        status: 'online',
        lastSeen: new Date().toISOString(),
      });
    }

    // Handle joining chat rooms
    socket.on('join_chat', async (chatId: string) => {
      try {
        // Verify user is participant in this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId,
        });

        if (chat) {
          socket.join(`chat:${chatId}`);
          const room = io.sockets.adapter.rooms.get(`chat:${chatId}`);
          logger.debug('User joined chat room', {
            userId: socket.userId,
            chatId,
            usersInRoom: room ? Array.from(room).length : 0,
          });
        } else {
          logger.warn('User attempted to join chat but not a participant', {
            userId: socket.userId,
            chatId,
          });
        }
      } catch (error) {
        logger.error('Error joining chat', error, { userId: socket.userId, chatId });
      }
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      logger.debug('User left chat room', { userId: socket.userId, chatId });
    });

    // Handle sending messages
    socket.on(
      'send_message',
      async (data: {
        chatId: string;
        content: string;
        type: 'TEXT' | 'FILE' | 'IMAGE';
        fileUrl?: string;
        fileName?: string;
      }) => {
        try {
          logger.debug('Socket send_message started', {
            userId: socket.userId,
            chatId: data.chatId,
            contentPreview: data.content?.substring(0, 50),
          });

          // Verify user is participant in this chat
          const chat = await Chat.findOne({
            _id: data.chatId,
            participants: socket.userId,
          });

          if (!chat) {
            logger.warn('Unauthorized message send attempt', {
              userId: socket.userId,
              chatId: data.chatId,
            });
            socket.emit('error', { message: 'Unauthorized to send message to this chat' });
            return;
          }

          // Create message in database
          const message = await Message.create({
            chatId: data.chatId,
            senderId: socket.userId!,
            content: data.content,
            type: data.type,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
          });

          logger.debug('Message created', { messageId: message._id.toString(), chatId: data.chatId });

          // Populate sender details
          await message.populate('senderId', 'firstName lastName profileImage role');

          // Format message for frontend
          const sender = message.senderId as { _id?: { toString(): string }; firstName?: string; lastName?: string; profileImage?: string; role?: string } | string;
          const senderId = typeof sender === 'object' && sender?._id ? sender._id.toString() : message.senderId.toString();
          const formattedMessage = {
            id: message._id.toString(),
            chatId: message.chatId.toString(),
            conversationId: message.chatId.toString(), // Also include conversationId for compatibility
            senderId,
            sender: typeof sender === 'object' && sender ? {
              id: senderId,
              firstName: sender.firstName || '',
              lastName: sender.lastName || '',
              name: `${sender.firstName || ''} ${sender.lastName || ''}`.trim(),
              profileImage: sender.profileImage || null,
              role: sender.role || '',
            } : {
              id: senderId,
              firstName: '',
              lastName: '',
              name: '',
              profileImage: null,
              role: '',
            },
            type: message.type,
            content: message.content,
            fileUrl: message.fileUrl || null,
            fileName: message.fileName || null,
            isRead: message.isRead,
            timestamp: message.createdAt,
            createdAt: message.createdAt,
          };

          // Broadcast message to all participants in the chat
          const room = io.sockets.adapter.rooms.get(`chat:${data.chatId}`);
          const roomSize = room ? Array.from(room).length : 0;
          
          logger.debug('Broadcasting message to chat room', {
            chatId: data.chatId,
            messageId: formattedMessage.id,
            usersInRoom: roomSize,
          });

          // Broadcast to chat room - all participants (including sender) will receive it
          io.to(`chat:${data.chatId}`).emit('new_message', formattedMessage);

          // Update chat's updatedAt timestamp
          await Chat.findByIdAndUpdate(data.chatId, { updatedAt: new Date() });

          // Send notification to tutor if message is from a student
          // Reuse the sender variable already defined above
          if (sender && typeof sender === 'object' && sender.role === 'STUDENT') {
            // Find tutor in chat participants
            const chat = await Chat.findById(data.chatId).populate(
              'participants',
              'firstName lastName role'
            );
            if (chat && (chat as any).participants) {
              const tutor = (chat as any).participants.find(
                (p: any) => p.role === 'TUTOR' && p._id.toString() !== socket.userId
              );
              if (tutor && typeof sender === 'object' && sender.firstName) {
                logger.debug('Sending notification to tutor', {
                  tutorId: tutor._id.toString(),
                  chatId: data.chatId,
                  senderId: socket.userId,
                });
                await sendNotificationToUser(io, tutor._id.toString(), {
                  type: 'message_received',
                  title: `💬 New Message from Student : ${sender.firstName} ${sender.lastName}`,
                  message: `${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
                  data: {
                    chatId: data.chatId,
                    messageId: message._id.toString(),
                    senderId: socket.userId!,
                    senderName: `${sender.firstName} ${sender.lastName}`,
                    content: data.content.substring(0, 100),
                  },
                });
              }
            }
          }

          logger.debug('Message sent successfully', {
            messageId: message._id.toString(),
            chatId: data.chatId,
          });
        } catch (error) {
          logger.error('Failed to send message via socket', error, {
            userId: socket.userId,
            chatId: data.chatId,
          });
          socket.emit('error', { message: 'Failed to send message' });
        }
      }
    );

    // Handle typing indicators
    socket.on('typing_start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId,
      });
    });

    socket.on('typing_stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        chatId,
      });
    });

    // Handle online status updates
    socket.on('update_status', (status: 'online' | 'away' | 'offline') => {
      if (socket.userId) {
        const userStatus = onlineUsers.get(socket.userId);
        if (userStatus) {
          userStatus.status = status;
          userStatus.lastSeen = new Date();
          onlineUsers.set(socket.userId, userStatus);

          // Broadcast status update
          io.emit('user_online_status', {
            userId: socket.userId,
            status,
            lastSeen: new Date().toISOString(),
          });
        }
      }
    });

    // Handle read receipts
    socket.on('mark_messages_read', async (data: { chatId: string }) => {
      try {
        if (!socket.userId) return;

        await Message.updateMany(
          {
            chatId: data.chatId,
            senderId: { $ne: socket.userId },
            isRead: false,
          },
          { isRead: true }
        );

        // Notify other participants
        socket.to(`chat:${data.chatId}`).emit('messages_read', {
          chatId: data.chatId,
          userId: socket.userId,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle session events
    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      logger.debug('User joined session', { userId: socket.userId, sessionId });
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      logger.debug('User left session', { userId: socket.userId, sessionId });
    });

    // Handle real-time notifications
    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            userId: socket.userId,
          },
          { isRead: true }
        );

        socket.emit('notification_updated', { id: notificationId, isRead: true });
      } catch (error) {
        logger.error('Error marking notification as read', error, {
          userId: socket.userId,
          notificationId: notificationId,
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected', { userId: socket.userId, reason });

      // Update user status to offline
      if (socket.userId) {
        const userStatus = onlineUsers.get(socket.userId);
        if (userStatus) {
          userStatus.status = 'offline';
          userStatus.lastSeen = new Date();
          onlineUsers.set(socket.userId, userStatus);

          // Broadcast offline status
          io.emit('user_online_status', {
            userId: socket.userId,
            status: 'offline',
            lastSeen: new Date().toISOString(),
          });
        }
      }
    });
  });

  // Expose function to get online users
  (io as any).getOnlineUsers = () => {
    const users: any[] = [];
    onlineUsers.forEach((value, userId) => {
      users.push({
        userId,
        status: value.status,
        lastSeen: value.lastSeen.toISOString(),
      });
    });
    return users;
  };

  return io;
};

// Helper function to send notifications to users
export const sendNotificationToUser = async (
  io: Server,
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: any;
  }
) => {
  try {
    // Save notification to database
    const savedNotification = await Notification.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });

    // Send real-time notification
    io.to(`user:${userId}`).emit('new_notification', savedNotification);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
