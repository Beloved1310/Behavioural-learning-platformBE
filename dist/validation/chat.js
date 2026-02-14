"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatStatsSchema = exports.reportChatSchema = exports.pinMessageSchema = exports.muteChatSchema = exports.leaveChatSchema = exports.updateChatSchema = exports.removeParticipantSchema = exports.addParticipantSchema = exports.uploadFileSchema = exports.searchUsersSchema = exports.editMessageSchema = exports.deleteMessageSchema = exports.markMessagesReadSchema = exports.sendMessageSchema = exports.getChatMessagesSchema = exports.createNewChatSchema = exports.getOrCreateChatSchema = exports.getChatByIdSchema = exports.getChatsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Get chats validation (matches ChatController.getUserChats)
exports.getChatsSchema = {
    query: common_1.paginationSchema.keys({
        search: joi_1.default.string().optional(), // Search term for filtering chats
    }),
};
// Get chat by ID validation
exports.getChatByIdSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
};
// Get or create chat validation (matches ChatController.getOrCreateChat)
exports.getOrCreateChatSchema = {
    body: joi_1.default.object({
        otherUserId: common_1.commonFields.objectId.required().messages({
            'any.required': 'Other user ID is required',
        }),
    }),
};
// Create new chat validation (matches ChatController.createNewChat)
exports.createNewChatSchema = {
    body: joi_1.default.object({
        otherUserId: common_1.commonFields.objectId.required().messages({
            'any.required': 'Other user ID is required',
        }),
        title: common_1.commonFields.shortText.optional(),
        returnExisting: common_1.commonFields.boolean.default(true),
    }),
};
// Get chat messages validation
exports.getChatMessagesSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    query: common_1.paginationSchema.keys({
        before: common_1.commonFields.objectId.optional(), // For pagination using message ID
        after: common_1.commonFields.objectId.optional(),
    }),
};
// Send message validation (matches ChatController.sendMessage)
exports.sendMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        content: common_1.commonFields.longText.optional(), // Optional for file messages
        type: common_1.commonFields.messageType.default('TEXT'),
        fileUrl: common_1.commonFields.url.optional(), // Optional, used for FILE/IMAGE types
        fileName: joi_1.default.string().max(255).optional(), // Optional, used for FILE/IMAGE types
    }).or('content', 'fileUrl').messages({
        'object.missing': 'Either content or fileUrl must be provided',
    }),
};
// Mark messages as read validation (matches ChatController.markMessagesAsRead)
exports.markMessagesReadSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    // No body required - marks all messages in chat as read
};
// Delete message validation
exports.deleteMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required(),
    }),
};
// Edit message validation
exports.editMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        content: common_1.commonFields.longText.required().messages({
            'string.empty': 'Message content is required',
        }),
    }),
};
// Search users validation (matches ChatController.searchUsers)
exports.searchUsersSchema = {
    query: common_1.paginationSchema.keys({
        query: joi_1.default.string().optional(), // Search query for users
    }),
};
// Upload file validation
exports.uploadFileSchema = {
    body: joi_1.default.object({
        file: joi_1.default.string().required().messages({
            'string.empty': 'File data is required',
        }),
        fileName: joi_1.default.string().max(255).required().messages({
            'string.empty': 'File name is required',
        }),
        mimeType: common_1.commonFields.mimeType.required(),
        size: common_1.commonFields.fileSize.required(),
    }),
};
// Add participant to chat validation
exports.addParticipantSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
    }),
};
// Remove participant from chat validation
exports.removeParticipantSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
    }),
};
// Update chat validation
exports.updateChatSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.optional(),
    })
        .min(1)
        .messages({
        'object.min': 'At least one field must be provided for update',
    }),
};
// Leave chat validation
exports.leaveChatSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
};
// Mute/unmute chat validation
exports.muteChatSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        muted: common_1.commonFields.boolean.required(),
        muteUntil: joi_1.default.when('muted', {
            is: true,
            then: joi_1.default.date().greater('now').iso().optional(),
            otherwise: joi_1.default.forbidden(),
        }),
    }),
};
// Pin/unpin message validation
exports.pinMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        pinned: common_1.commonFields.boolean.required(),
    }),
};
// Report chat/message validation
exports.reportChatSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    body: joi_1.default.object({
        messageId: common_1.commonFields.objectId.optional(),
        reason: joi_1.default.string()
            .valid('inappropriate_content', 'harassment', 'spam', 'violence', 'hate_speech', 'other')
            .required(),
        description: common_1.commonFields.longText.required().messages({
            'string.empty': 'Description is required',
        }),
    }),
};
// Get chat statistics validation
exports.getChatStatsSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
    }),
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
    }),
};
//# sourceMappingURL=chat.js.map