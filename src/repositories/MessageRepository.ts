import { FilterQuery, Types } from 'mongoose';
import { Message } from '../models/Message';
import { IMessage } from '../types';
import { BaseRepository } from './BaseRepository';

class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(Message as any);
  }

  async findLastMessage(chatId: string) {
    return (Message as any)
      .findOne({ chatId: new Types.ObjectId(chatId) })
      .sort({ createdAt: -1 })
      .populate('senderId', 'firstName lastName');
  }

  async countUnread(chatId: string, userId: string) {
    return (Message as any).countDocuments({
      chatId: new Types.ObjectId(chatId),
      senderId: { $ne: new Types.ObjectId(userId) },
      isRead: false,
    });
  }

  async getChatMessages(chatId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const messages = await (Message as any)
      .find({ chatId: new Types.ObjectId(chatId) })
      .populate('senderId', 'firstName lastName profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await (Message as any).countDocuments({ chatId: new Types.ObjectId(chatId) });
    return { messages, total };
  }

  async markAsRead(chatId: string, userId: string) {
    return (Message as any).updateMany(
      {
        chatId: new Types.ObjectId(chatId),
        senderId: { $ne: new Types.ObjectId(userId) },
        isRead: false,
      },
      { isRead: true }
    );
  }

  async deleteByChatId(chatId: string) {
    return (Message as any).deleteMany({ chatId: new Types.ObjectId(chatId) });
  }

  async countUnreadAcross(chatIds: string[], userId: string) {
    const ids = chatIds.map((id) => new Types.ObjectId(id));
    return (Message as any).countDocuments({
      chatId: { $in: ids },
      senderId: { $ne: new Types.ObjectId(userId) },
      isRead: false,
    });
  }
}

export const messageRepository = new MessageRepository();
export default messageRepository;
