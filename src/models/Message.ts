import { Schema, model } from 'mongoose';
import { IMessage, MessageType } from '../types';

const messageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT
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
messageSchema.statics.getChatMessages = function(
  chatId: string, 
  page: number = 1, 
  limit: number = 50
) {
  const skip = (page - 1) * limit;
  return this.find({ chatId })
    .populate('sender', 'firstName lastName profileImage role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = function(chatId: string, userId: string) {
  return this.updateMany(
    { 
      chatId, 
      senderId: { $ne: userId },
      isRead: false 
    },
    { isRead: true }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = function(chatId: string, userId: string) {
  return this.countDocuments({
    chatId,
    senderId: { $ne: userId },
    isRead: false
  });
};

export const Message = model<IMessage>('Message', messageSchema);