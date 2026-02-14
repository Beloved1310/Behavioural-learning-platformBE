"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = exports.setupSocketIO = exports.getIO = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const models_1 = require("../models");
const logger_1 = require("../utils/logger");
// Store for tracking online users
const onlineUsers = new Map();
// Store the io instance
let ioInstance = null;
// Export function to get the io instance
const getIO = () => {
    return ioInstance;
};
exports.getIO = getIO;
const setupSocketIO = (io) => {
    ioInstance = io;
    // Authentication middleware for socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
            // Verify user exists
            const user = await models_1.User.findById(decoded.userId);
            if (!user) {
                return next(new Error('User not found'));
            }
            socket.userId = user._id.toString();
            socket.userRole = user.role;
            next();
        }
        catch (error) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', (socket) => {
        logger_1.logger.info('User connected via Socket.IO', {
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
        socket.on('join_chat', async (chatId) => {
            try {
                // Verify user is participant in this chat
                const chat = await models_1.Chat.findOne({
                    _id: chatId,
                    participants: socket.userId,
                });
                if (chat) {
                    socket.join(`chat:${chatId}`);
                    const room = io.sockets.adapter.rooms.get(`chat:${chatId}`);
                    logger_1.logger.debug('User joined chat room', {
                        userId: socket.userId,
                        chatId,
                        usersInRoom: room ? Array.from(room).length : 0,
                    });
                }
                else {
                    logger_1.logger.warn('User attempted to join chat but not a participant', {
                        userId: socket.userId,
                        chatId,
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Error joining chat', error, { userId: socket.userId, chatId });
            }
        });
        // Handle leaving chat rooms
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            logger_1.logger.debug('User left chat room', { userId: socket.userId, chatId });
        });
        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                logger_1.logger.debug('Socket send_message started', {
                    userId: socket.userId,
                    chatId: data.chatId,
                    contentPreview: data.content?.substring(0, 50),
                });
                // Verify user is participant in this chat
                const chat = await models_1.Chat.findOne({
                    _id: data.chatId,
                    participants: socket.userId,
                });
                if (!chat) {
                    logger_1.logger.warn('Unauthorized message send attempt', {
                        userId: socket.userId,
                        chatId: data.chatId,
                    });
                    socket.emit('error', { message: 'Unauthorized to send message to this chat' });
                    return;
                }
                // Create message in database
                const message = await models_1.Message.create({
                    chatId: data.chatId,
                    senderId: socket.userId,
                    content: data.content,
                    type: data.type,
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                });
                logger_1.logger.debug('Message created', { messageId: message._id.toString(), chatId: data.chatId });
                // Populate sender details
                await message.populate('senderId', 'firstName lastName profileImage role');
                // Format message for frontend
                const sender = message.senderId;
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
                logger_1.logger.debug('Broadcasting message to chat room', {
                    chatId: data.chatId,
                    messageId: formattedMessage.id,
                    usersInRoom: roomSize,
                });
                // Broadcast to chat room - all participants (including sender) will receive it
                io.to(`chat:${data.chatId}`).emit('new_message', formattedMessage);
                // Update chat's updatedAt timestamp
                await models_1.Chat.findByIdAndUpdate(data.chatId, { updatedAt: new Date() });
                // Send notification to tutor if message is from a student
                // Reuse the sender variable already defined above
                if (sender && typeof sender === 'object' && sender.role === 'STUDENT') {
                    // Find tutor in chat participants
                    const chat = await models_1.Chat.findById(data.chatId).populate('participants', 'firstName lastName role');
                    if (chat && chat.participants) {
                        const tutor = chat.participants.find((p) => p.role === 'TUTOR' && p._id.toString() !== socket.userId);
                        if (tutor && typeof sender === 'object' && sender.firstName) {
                            logger_1.logger.debug('Sending notification to tutor', {
                                tutorId: tutor._id.toString(),
                                chatId: data.chatId,
                                senderId: socket.userId,
                            });
                            await (0, exports.sendNotificationToUser)(io, tutor._id.toString(), {
                                type: 'message_received',
                                title: `💬 New Message from Student : ${sender.firstName} ${sender.lastName}`,
                                message: `${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
                                data: {
                                    chatId: data.chatId,
                                    messageId: message._id.toString(),
                                    senderId: socket.userId,
                                    senderName: `${sender.firstName} ${sender.lastName}`,
                                    content: data.content.substring(0, 100),
                                },
                            });
                        }
                    }
                }
                logger_1.logger.debug('Message sent successfully', {
                    messageId: message._id.toString(),
                    chatId: data.chatId,
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to send message via socket', error, {
                    userId: socket.userId,
                    chatId: data.chatId,
                });
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicators
        socket.on('typing_start', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user_typing', {
                userId: socket.userId,
                chatId,
            });
        });
        socket.on('typing_stop', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user_stop_typing', {
                userId: socket.userId,
                chatId,
            });
        });
        // Handle online status updates
        socket.on('update_status', (status) => {
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
        socket.on('mark_messages_read', async (data) => {
            try {
                if (!socket.userId)
                    return;
                await models_1.Message.updateMany({
                    chatId: data.chatId,
                    senderId: { $ne: socket.userId },
                    isRead: false,
                }, { isRead: true });
                // Notify other participants
                socket.to(`chat:${data.chatId}`).emit('messages_read', {
                    chatId: data.chatId,
                    userId: socket.userId,
                });
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        // Handle session events
        socket.on('join_session', (sessionId) => {
            socket.join(`session:${sessionId}`);
            logger_1.logger.debug('User joined session', { userId: socket.userId, sessionId });
        });
        socket.on('leave_session', (sessionId) => {
            socket.leave(`session:${sessionId}`);
            logger_1.logger.debug('User left session', { userId: socket.userId, sessionId });
        });
        // Handle real-time notifications
        socket.on('mark_notification_read', async (notificationId) => {
            try {
                await models_1.Notification.findOneAndUpdate({
                    _id: notificationId,
                    userId: socket.userId,
                }, { isRead: true });
                socket.emit('notification_updated', { id: notificationId, isRead: true });
            }
            catch (error) {
                logger_1.logger.error('Error marking notification as read', error, {
                    userId: socket.userId,
                    notificationId: notificationId,
                });
            }
        });
        // Handle disconnect
        socket.on('disconnect', (reason) => {
            logger_1.logger.info('User disconnected', { userId: socket.userId, reason });
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
    io.getOnlineUsers = () => {
        const users = [];
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
exports.setupSocketIO = setupSocketIO;
// Helper function to send notifications to users
const sendNotificationToUser = async (io, userId, notification) => {
    try {
        // Save notification to database
        const savedNotification = await models_1.Notification.create({
            userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
        });
        // Send real-time notification
        io.to(`user:${userId}`).emit('new_notification', savedNotification);
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
};
exports.sendNotificationToUser = sendNotificationToUser;
//# sourceMappingURL=index.js.map