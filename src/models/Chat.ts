import { Schema, model } from 'mongoose';
import { IChat } from '../types';

const chatSchema = new Schema<IChat>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  title: {
    type: String,
    trim: true,
    maxlength: 100
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Virtual to get the latest message
chatSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chatId',
  justOne: true,
  options: { sort: { createdAt: -1 } }
});

// Static method to find chats for a user
chatSchema.statics.findUserChats = function(userId: string) {
  return this.find({
    participants: userId
  }).populate('lastMessage').sort({ updatedAt: -1 });
};

// Static method to find or create a chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id: string, user2Id: string) {
  let chat = await this.findOne({
    participants: { $all: [user1Id, user2Id], $size: 2 }
  });

  if (!chat) {
    chat = await this.create({
      participants: [user1Id, user2Id]
    });
  }

  return chat;
};

export const Chat = model<IChat>('Chat', chatSchema);