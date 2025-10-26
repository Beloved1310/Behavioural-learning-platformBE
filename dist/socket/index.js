"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationToUser = exports.setupSocketIO = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const models_1 = require("../models");
// Store for tracking online users
const onlineUsers = new Map();
const setupSocketIO = (io) => {
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
        socket.on('join_chat', async (chatId) => {
            try {
                // Verify user is participant in this chat
                const chat = await models_1.Chat.findOne({
                    _id: chatId,
                    participants: socket.userId
                });
                if (chat) {
                    socket.join(`chat:${chatId}`);
                    console.log(`User ${socket.userId} joined chat ${chatId}`);
                }
            }
            catch (error) {
                console.error('Error joining chat:', error);
            }
        });
        // Handle leaving chat rooms
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat:${chatId}`);
            console.log(`User ${socket.userId} left chat ${chatId}`);
        });
        // Handle sending messages
        socket.on('send_message', async (data) => {
            try {
                // Verify user is participant in this chat
                const chat = await models_1.Chat.findOne({
                    _id: data.chatId,
                    participants: socket.userId
                });
                if (!chat) {
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
                    fileName: data.fileName
                });
                // Populate sender details
                await message.populate('sender', 'firstName lastName profileImage role');
                // Broadcast message to all participants in the chat
                io.to(`chat:${data.chatId}`).emit('new_message', message);
                // Update chat's updatedAt timestamp
                await models_1.Chat.findByIdAndUpdate(data.chatId, { updatedAt: new Date() });
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicators
        socket.on('typing_start', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user_typing', {
                userId: socket.userId,
                chatId
            });
        });
        socket.on('typing_stop', (chatId) => {
            socket.to(`chat:${chatId}`).emit('user_stop_typing', {
                userId: socket.userId,
                chatId
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
                        lastSeen: new Date().toISOString()
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
                    isRead: false
                }, { isRead: true });
                // Notify other participants
                socket.to(`chat:${data.chatId}`).emit('messages_read', {
                    chatId: data.chatId,
                    userId: socket.userId
                });
            }
            catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
        // Handle session events
        socket.on('join_session', (sessionId) => {
            socket.join(`session:${sessionId}`);
            console.log(`User ${socket.userId} joined session ${sessionId}`);
        });
        socket.on('leave_session', (sessionId) => {
            socket.leave(`session:${sessionId}`);
            console.log(`User ${socket.userId} left session ${sessionId}`);
        });
        // Handle real-time notifications
        socket.on('mark_notification_read', async (notificationId) => {
            try {
                await models_1.Notification.findOneAndUpdate({
                    _id: notificationId,
                    userId: socket.userId
                }, { isRead: true });
                socket.emit('notification_updated', { id: notificationId, isRead: true });
            }
            catch (error) {
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
    io.getOnlineUsers = () => {
        const users = [];
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
            data: notification.data
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