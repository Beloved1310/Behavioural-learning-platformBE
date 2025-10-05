"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
const mongoose_1 = require("mongoose");
const types_1 = require("../types");
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
        index: true
    },
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: Object.values(types_1.MessageType),
        default: types_1.MessageType.TEXT
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    fileUrl: {
        type: String
    },
    fileName: {
        type: String
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Compound indexes for efficient queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, isRead: 1 });
// Virtual to populate sender details
messageSchema.virtual('sender', {
    ref: 'User',
    localField: 'senderId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName profileImage role'
});
// Static method to get chat messages with pagination
messageSchema.statics.getChatMessages = function (chatId, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.find({ chatId })
        .populate('sender', 'firstName lastName profileImage role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
};
// Static method to mark messages as read
messageSchema.statics.markAsRead = function (chatId, userId) {
    return this.updateMany({
        chatId,
        senderId: { $ne: userId },
        isRead: false
    }, { isRead: true });
};
// Static method to get unread message count
messageSchema.statics.getUnreadCount = function (chatId, userId) {
    return this.countDocuments({
        chatId,
        senderId: { $ne: userId },
        isRead: false
    });
};
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
//# sourceMappingURL=Message.js.map