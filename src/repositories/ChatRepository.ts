import { FilterQuery, Types } from 'mongoose';
import { Chat } from '../models/Chat';
import { IChat } from '../types';
import { BaseRepository } from './BaseRepository';

class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(Chat as any);
  }

  async findUserChats(userId: string, search?: string) {
    const query: any = { participants: new Types.ObjectId(userId) };

    // If search term is provided, filter by participant names or title
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
      ];
    }

    return (Chat as any)
      .find(query)
      .populate('participants', 'firstName lastName email profileImage role')
      .sort({ updatedAt: -1 });
  }

  async findOrCreate(userId: string, otherUserId: string) {
    let chat: any = await (Chat as any)
      .findOne({
        participants: {
          $all: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
          $size: 2,
        },
      })
      .populate('participants', 'firstName lastName email profileImage role');
    if (!chat) {
      chat = await (Chat as any).create({
        participants: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
      });
      await chat.populate('participants', 'firstName lastName profileImage role');
    }
    return chat;
  }

  async isParticipant(chatId: string, userId: string) {
    const chat = await (Chat as any).findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    return chat;
  }

  async findExistingChat(userId: string, otherUserId: string) {
    return (Chat as any).findOne({
      participants: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
        $size: 2,
      },
    });
  }

  async createNewChat(userId: string, otherUserId: string, title?: string) {
    const chat = await (Chat as any).create({
      participants: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
      title: title || undefined,
    });
    await chat.populate('participants', 'firstName lastName profileImage role');
    return chat;
  }
}

export const chatRepository = new ChatRepository();
export default chatRepository;
