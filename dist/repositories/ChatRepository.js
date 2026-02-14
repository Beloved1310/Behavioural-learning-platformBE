"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRepository = void 0;
const mongoose_1 = require("mongoose");
const Chat_1 = require("../models/Chat");
const BaseRepository_1 = require("./BaseRepository");
class ChatRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Chat_1.Chat);
    }
    async findUserChats(userId, search) {
        const query = { participants: new mongoose_1.Types.ObjectId(userId) };
        // If search term is provided, filter by participant names or title
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { title: searchRegex },
            ];
        }
        return Chat_1.Chat
            .find(query)
            .populate('participants', 'firstName lastName email profileImage role')
            .sort({ updatedAt: -1 });
    }
    async findOrCreate(userId, otherUserId) {
        let chat = await Chat_1.Chat
            .findOne({
            participants: {
                $all: [new mongoose_1.Types.ObjectId(userId), new mongoose_1.Types.ObjectId(otherUserId)],
                $size: 2,
            },
        })
            .populate('participants', 'firstName lastName email profileImage role');
        if (!chat) {
            chat = await Chat_1.Chat.create({
                participants: [new mongoose_1.Types.ObjectId(userId), new mongoose_1.Types.ObjectId(otherUserId)],
            });
            await chat.populate('participants', 'firstName lastName profileImage role');
        }
        return chat;
    }
    async isParticipant(chatId, userId) {
        const chat = await Chat_1.Chat.findOne({
            _id: new mongoose_1.Types.ObjectId(chatId),
            participants: new mongoose_1.Types.ObjectId(userId),
        });
        return chat;
    }
    async findExistingChat(userId, otherUserId) {
        return Chat_1.Chat.findOne({
            participants: {
                $all: [new mongoose_1.Types.ObjectId(userId), new mongoose_1.Types.ObjectId(otherUserId)],
                $size: 2,
            },
        });
    }
    async createNewChat(userId, otherUserId, title) {
        const chat = await Chat_1.Chat.create({
            participants: [new mongoose_1.Types.ObjectId(userId), new mongoose_1.Types.ObjectId(otherUserId)],
            title: title || undefined,
        });
        await chat.populate('participants', 'firstName lastName profileImage role');
        return chat;
    }
}
exports.chatRepository = new ChatRepository();
exports.default = exports.chatRepository;
//# sourceMappingURL=ChatRepository.js.map