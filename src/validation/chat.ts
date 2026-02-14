import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Get chats validation (matches ChatController.getUserChats)
export const getChatsSchema = {
  query: paginationSchema.keys({
    search: Joi.string().optional(), // Search term for filtering chats
  }),
};

// Get chat by ID validation
export const getChatByIdSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
};

// Get or create chat validation (matches ChatController.getOrCreateChat)
export const getOrCreateChatSchema = {
  body: Joi.object({
    otherUserId: commonFields.objectId.required().messages({
      'any.required': 'Other user ID is required',
    }),
  }),
};

// Create new chat validation (matches ChatController.createNewChat)
export const createNewChatSchema = {
  body: Joi.object({
    otherUserId: commonFields.objectId.required().messages({
      'any.required': 'Other user ID is required',
    }),
    title: commonFields.shortText.optional(),
    returnExisting: commonFields.boolean.default(true),
  }),
};

// Get chat messages validation
export const getChatMessagesSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  query: paginationSchema.keys({
    before: commonFields.objectId.optional(), // For pagination using message ID
    after: commonFields.objectId.optional(),
  }),
};

// Send message validation (matches ChatController.sendMessage)
export const sendMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    content: commonFields.longText.optional(), // Optional for file messages
    type: commonFields.messageType.default('TEXT'),
    fileUrl: commonFields.url.optional(), // Optional, used for FILE/IMAGE types
    fileName: Joi.string().max(255).optional(), // Optional, used for FILE/IMAGE types
  }).or('content', 'fileUrl').messages({
    'object.missing': 'Either content or fileUrl must be provided',
  }),
};

// Mark messages as read validation (matches ChatController.markMessagesAsRead)
export const markMessagesReadSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  // No body required - marks all messages in chat as read
};

// Delete message validation
export const deleteMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required(),
  }),
};

// Edit message validation
export const editMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    content: commonFields.longText.required().messages({
      'string.empty': 'Message content is required',
    }),
  }),
};

// Search users validation (matches ChatController.searchUsers)
export const searchUsersSchema = {
  query: paginationSchema.keys({
    query: Joi.string().optional(), // Search query for users
  }),
};

// Upload file validation
export const uploadFileSchema = {
  body: Joi.object({
    file: Joi.string().required().messages({
      'string.empty': 'File data is required',
    }),
    fileName: Joi.string().max(255).required().messages({
      'string.empty': 'File name is required',
    }),
    mimeType: commonFields.mimeType.required(),
    size: commonFields.fileSize.required(),
  }),
};

// Add participant to chat validation
export const addParticipantSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    userId: commonFields.objectId.required(),
  }),
};

// Remove participant from chat validation
export const removeParticipantSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    userId: commonFields.objectId.required(),
  }),
};

// Update chat validation
export const updateChatSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    title: commonFields.shortText.optional(),
  })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

// Leave chat validation
export const leaveChatSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
};

// Mute/unmute chat validation
export const muteChatSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    muted: commonFields.boolean.required(),
    muteUntil: Joi.when('muted', {
      is: true,
      then: Joi.date().greater('now').iso().optional(),
      otherwise: Joi.forbidden(),
    }),
  }),
};

// Pin/unpin message validation
export const pinMessageSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
    messageId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    pinned: commonFields.boolean.required(),
  }),
};

// Report chat/message validation
export const reportChatSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  body: Joi.object({
    messageId: commonFields.objectId.optional(),
    reason: Joi.string()
      .valid('inappropriate_content', 'harassment', 'spam', 'violence', 'hate_speech', 'other')
      .required(),
    description: commonFields.longText.required().messages({
      'string.empty': 'Description is required',
    }),
  }),
};

// Get chat statistics validation
export const getChatStatsSchema = {
  params: Joi.object({
    chatId: commonFields.objectId.required(),
  }),
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
  }),
};
