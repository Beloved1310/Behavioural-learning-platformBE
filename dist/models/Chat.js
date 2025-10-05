"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    participants: [{
            type: mongoose_1.Schema.Types.ObjectId,
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
chatSchema.statics.findUserChats = function (userId) {
    return this.find({
        participants: userId
    }).populate('lastMessage').sort({ updatedAt: -1 });
};
// Static method to find or create a chat between two users
chatSchema.statics.findOrCreateChat = async function (user1Id, user2Id) {
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
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
//# sourceMappingURL=Chat.js.map