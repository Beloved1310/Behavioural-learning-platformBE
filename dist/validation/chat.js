"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatStatsSchema = exports.reportChatSchema = exports.pinMessageSchema = exports.muteChatSchema = exports.leaveChatSchema = exports.updateChatSchema = exports.removeParticipantSchema = exports.addParticipantSchema = exports.uploadFileSchema = exports.searchMessagesSchema = exports.editMessageSchema = exports.deleteMessageSchema = exports.markMessagesReadSchema = exports.sendMessageSchema = exports.getChatMessagesSchema = exports.createChatSchema = exports.getChatByIdSchema = exports.getChatsSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Get chats validation
exports.getChatsSchema = {
    query: common_1.paginationSchema.keys({
        unreadOnly: common_1.commonFields.boolean.default(false)
    })
};
// Get chat by ID validation
exports.getChatByIdSchema = {
    params: common_1.idParamSchema
};
// Create chat validation
exports.createChatSchema = {
    body: joi_1.default.object({
        participantId: common_1.commonFields.objectId.required(),
        title: common_1.commonFields.shortText.optional(),
        initialMessage: common_1.commonFields.longText.optional()
    })
};
// Get chat messages validation
exports.getChatMessagesSchema = {
    params: common_1.idParamSchema,
    query: common_1.paginationSchema.keys({
        before: common_1.commonFields.objectId.optional(), // For pagination using message ID
        after: common_1.commonFields.objectId.optional()
    })
};
// Send message validation
exports.sendMessageSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        type: common_1.commonFields.messageType.default('TEXT'),
        content: joi_1.default.when('type', {
            is: 'TEXT',
            then: common_1.commonFields.longText.required().messages({
                'string.empty': 'Message content is required'
            }),
            otherwise: common_1.commonFields.shortText.optional()
        }),
        fileUrl: joi_1.default.when('type', {
            is: joi_1.default.string().valid('FILE', 'IMAGE'),
            then: common_1.commonFields.url.required(),
            otherwise: joi_1.default.forbidden()
        }),
        fileName: joi_1.default.when('type', {
            is: joi_1.default.string().valid('FILE', 'IMAGE'),
            then: joi_1.default.string().max(255).required(),
            otherwise: joi_1.default.forbidden()
        }),
        replyToId: common_1.commonFields.objectId.optional() // For message replies
    })
};
// Mark messages as read validation
exports.markMessagesReadSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        messageIds: joi_1.default.array().items(common_1.commonFields.objectId).min(1).max(50).optional(),
        markAllAsRead: common_1.commonFields.boolean.default(false)
    }).or('messageIds', 'markAllAsRead').messages({
        'object.missing': 'Either messageIds or markAllAsRead must be provided'
    })
};
// Delete message validation
exports.deleteMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required()
    })
};
// Edit message validation
exports.editMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required()
    }),
    body: joi_1.default.object({
        content: common_1.commonFields.longText.required().messages({
            'string.empty': 'Message content is required'
        })
    })
};
// Search messages validation
exports.searchMessagesSchema = {
    params: common_1.idParamSchema,
    query: common_1.paginationSchema.keys({
        query: common_1.commonFields.searchQuery.required(),
        type: common_1.commonFields.messageType.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Upload file validation
exports.uploadFileSchema = {
    body: joi_1.default.object({
        file: joi_1.default.string().required().messages({
            'string.empty': 'File data is required'
        }),
        fileName: joi_1.default.string().max(255).required().messages({
            'string.empty': 'File name is required'
        }),
        mimeType: common_1.commonFields.mimeType.required(),
        size: common_1.commonFields.fileSize.required()
    })
};
// Add participant to chat validation
exports.addParticipantSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    })
};
// Remove participant from chat validation
exports.removeParticipantSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    })
};
// Update chat validation
exports.updateChatSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        title: common_1.commonFields.shortText.optional()
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Leave chat validation
exports.leaveChatSchema = {
    params: common_1.idParamSchema
};
// Mute/unmute chat validation
exports.muteChatSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        muted: common_1.commonFields.boolean.required(),
        muteUntil: joi_1.default.when('muted', {
            is: true,
            then: joi_1.default.date().greater('now').iso().optional(),
            otherwise: joi_1.default.forbidden()
        })
    })
};
// Pin/unpin message validation
exports.pinMessageSchema = {
    params: joi_1.default.object({
        chatId: common_1.commonFields.objectId.required(),
        messageId: common_1.commonFields.objectId.required()
    }),
    body: joi_1.default.object({
        pinned: common_1.commonFields.boolean.required()
    })
};
// Report chat/message validation
exports.reportChatSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        messageId: common_1.commonFields.objectId.optional(),
        reason: joi_1.default.string().valid('inappropriate_content', 'harassment', 'spam', 'violence', 'hate_speech', 'other').required(),
        description: common_1.commonFields.longText.required().messages({
            'string.empty': 'Description is required'
        })
    })
};
// Get chat statistics validation
exports.getChatStatsSchema = {
    params: common_1.idParamSchema,
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month')
    })
};
//# sourceMappingURL=chat.js.map