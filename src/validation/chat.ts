import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Get chats validation
export const getChatsSchema = {
  query: paginationSchema.keys({
    unreadOnly: commonFields.boolean.default(false)
  })
};

// Get chat by ID validation
export const getChatByIdSchema = {
  params: idParamSchema
};

// Create chat validation
export const createChatSchema = {
  body: Joi.object({
    participantId: commonFields.objectId.required(),
    title: commonFields.shortText.optional(),
    initialMessage: commonFields.longText.optional()
  })
};

// Get chat messages validation
export const getChatMessagesSchema = {
  params: idParamSchema,
  query: paginationSchema.keys({
    before: commonFields.objectId.optional(), // For pagination using message ID
    after: commonFields.objectId.optional()
  })
};

// Send message validation
export const sendMessageSchema = {
  params: idParamSchema,
  body: Joi.object({
    type: commonFields.messageType.default('TEXT'),
    content: Joi.when('type', {
      is: 'TEXT',
      then: commonFields.longText.required().messages({
        'string.empty': 'Message content is required'
      }),
      otherwise: commonFields.shortText.optional()
    }),
    fileUrl: Joi.when('type', {
      is: Joi.string().valid('FILE', 'IMAGE'),
      then: commonFields.url.required(),
      otherwise: Joi.forbidden()
    }),
    fileName: Joi.when('type', {
      is: Joi.string().valid('FILE', 'IMAGE'),
      then: Joi.string().max(255).required(),
      otherwise: Joi.forbidden()
    }),
    replyToId: commonFields.objectId.optional() // For message replies
  })
};

// Mark messages as read validation
export const markMessagesReadSchema = {
  params: idParamSchema,
  body: Joi.object({
    messageIds: Joi.array().items(commonFields.objectId).min(1).max(50).optional(),
    markAllAsRead: commonFields.boolean.default(false)
  }).or('messageIds', 'markAllAsRead').messages({
    'object.missing': 'Either messageIds or markAllAsRead must be provided'
  })
};

// Delete message validation
export const deleteMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required()
  })
};

// Edit message validation
export const editMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required()
  }),
  body: Joi.object({
    content: commonFields.longText.required().messages({
      'string.empty': 'Message content is required'
    })
  })
};

// Search messages validation
export const searchMessagesSchema = {
  params: idParamSchema,
  query: paginationSchema.keys({
    query: commonFields.searchQuery.required(),
    type: commonFields.messageType.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Upload file validation
export const uploadFileSchema = {
  body: Joi.object({
    file: Joi.string().required().messages({
      'string.empty': 'File data is required'
    }),
    fileName: Joi.string().max(255).required().messages({
      'string.empty': 'File name is required'
    }),
    mimeType: commonFields.mimeType.required(),
    size: commonFields.fileSize.required()
  })
};

// Add participant to chat validation
export const addParticipantSchema = {
  params: idParamSchema,
  body: Joi.object({
    userId: commonFields.objectId.required()
  })
};

// Remove participant from chat validation
export const removeParticipantSchema = {
  params: idParamSchema,
  body: Joi.object({
    userId: commonFields.objectId.required()
  })
};

// Update chat validation
export const updateChatSchema = {
  params: idParamSchema,
  body: Joi.object({
    title: commonFields.shortText.optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Leave chat validation
export const leaveChatSchema = {
  params: idParamSchema
};

// Mute/unmute chat validation
export const muteChatSchema = {
  params: idParamSchema,
  body: Joi.object({
    muted: commonFields.boolean.required(),
    muteUntil: Joi.when('muted', {
      is: true,
      then: Joi.date().greater('now').iso().optional(),
      otherwise: Joi.forbidden()
    })
  })
};

// Pin/unpin message validation
export const pinMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required()
  }),
  body: Joi.object({
    pinned: commonFields.boolean.required()
  })
};

// Report chat/message validation
export const reportChatSchema = {
  params: idParamSchema,
  body: Joi.object({
    messageId: commonFields.objectId.optional(),
    reason: Joi.string().valid(
      'inappropriate_content',
      'harassment',
      'spam',
      'violence',
      'hate_speech',
      'other'
    ).required(),
    description: commonFields.longText.required().messages({
      'string.empty': 'Description is required'
    })
  })
};

// Get chat statistics validation
export const getChatStatsSchema = {
  params: idParamSchema,
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month')
  })
};