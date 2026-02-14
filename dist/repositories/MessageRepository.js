"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRepository = void 0;
const mongoose_1 = require("mongoose");
const Message_1 = require("../models/Message");
const BaseRepository_1 = require("./BaseRepository");
class MessageRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(Message_1.Message);
    }
    async findLastMessage(chatId) {
        return Message_1.Message
            .findOne({ chatId: new mongoose_1.Types.ObjectId(chatId) })
            .sort({ createdAt: -1 })
            .populate('senderId', 'firstName lastName');
    }
    async countUnread(chatId, userId) {
        return Message_1.Message.countDocuments({
            chatId: new mongoose_1.Types.ObjectId(chatId),
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            isRead: false,
        });
    }
    async getChatMessages(chatId, page, limit) {
        const skip = (page - 1) * limit;
        const messages = await Message_1.Message
            .find({ chatId: new mongoose_1.Types.ObjectId(chatId) })
            .populate('senderId', 'firstName lastName profileImage role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Message_1.Message.countDocuments({ chatId: new mongoose_1.Types.ObjectId(chatId) });
        return { messages, total };
    }
    async markAsRead(chatId, userId) {
        return Message_1.Message.updateMany({
            chatId: new mongoose_1.Types.ObjectId(chatId),
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            isRead: false,
        }, { isRead: true });
    }
    async deleteByChatId(chatId) {
        return Message_1.Message.deleteMany({ chatId: new mongoose_1.Types.ObjectId(chatId) });
    }
    async countUnreadAcross(chatIds, userId) {
        const ids = chatIds.map((id) => new mongoose_1.Types.ObjectId(id));
        return Message_1.Message.countDocuments({
            chatId: { $in: ids },
            senderId: { $ne: new mongoose_1.Types.ObjectId(userId) },
            isRead: false,
        });
    }
}
exports.messageRepository = new MessageRepository();
exports.default = exports.messageRepository;
//# sourceMappingURL=MessageRepository.js.map