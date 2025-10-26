import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';
import { User, Chat, Message, Notification } from '../models';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Store for tracking online users
const onlineUsers = new Map<string, { socketId: string; status: 'online' | 'away' | 'offline'; lastSeen: Date }>();

export const setupSocketIO = (io: Server) => {
  // Authentication middleware for socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
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
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Track user as online
    if (socket.userId) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        status: 'online',
        lastSeen: new Date()
      });

      // Broadcast online status to all connected clients
      io.emit('user_online_status', {
        userId: socket.userId,
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    }

    // Handle joining chat rooms
    socket.on('join_chat', async (chatId: string) => {
      try {
        // Verify user is participant in this chat
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId
        });

        if (chat) {
          socket.join(`chat:${chatId}`);
          console.log(`User ${socket.userId} joined chat ${chatId}`);
        }
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${socket.userId} left chat ${chatId}`);
    });

    // Handle sending messages
    socket.on('send_message', async (data: {
      chatId: string;
      content: string;
      type: 'TEXT' | 'FILE' | 'IMAGE';
      fileUrl?: string;
      fileName?: string;
    }) => {
      try {
        // Verify user is participant in this chat
        const chat = await Chat.findOne({
          _id: data.chatId,
          participants: socket.userId
        });

        if (!chat) {
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
          fileName: data.fileName
        });

        // Populate sender details
        await message.populate('sender', 'firstName lastName profileImage role');

        // Broadcast message to all participants in the chat
        io.to(`chat:${data.chatId}`).emit('new_message', message);

        // Update chat's updatedAt timestamp
        await Chat.findByIdAndUpdate(data.chatId, { updatedAt: new Date() });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_typing', {
        userId: socket.userId,
        chatId
      });
    });

    socket.on('typing_stop', (chatId: string) => {
      socket.to(`chat:${chatId}`).emit('user_stop_typing', {
        userId: socket.userId,
        chatId
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
            lastSeen: new Date().toISOString()
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
            isRead: false
          },
          { isRead: true }
        );

        // Notify other participants
        socket.to(`chat:${data.chatId}`).emit('messages_read', {
          chatId: data.chatId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle session events
    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`);
      console.log(`User ${socket.userId} joined session ${sessionId}`);
    });

    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`);
      console.log(`User ${socket.userId} left session ${sessionId}`);
    });

    // Handle real-time notifications
    socket.on('mark_notification_read', async (notificationId: string) => {
      try {
        await Notification.findOneAndUpdate(
          {
            _id: notificationId,
            userId: socket.userId
          },
          { isRead: true }
        );

        socket.emit('notification_updated', { id: notificationId, isRead: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);

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
            lastSeen: new Date().toISOString()
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
        lastSeen: value.lastSeen.toISOString()
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
      data: notification.data
    });

    // Send real-time notification
    io.to(`user:${userId}`).emit('new_notification', savedNotification);

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};