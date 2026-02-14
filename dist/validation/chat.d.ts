import Joi from 'joi';
export declare const getChatsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getChatByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getOrCreateChatSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const createNewChatSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getChatMessagesSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const sendMessageSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const markMessagesReadSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const deleteMessageSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const editMessageSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const searchUsersSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const uploadFileSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const addParticipantSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const removeParticipantSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const updateChatSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const leaveChatSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const muteChatSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const pinMessageSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const reportChatSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getChatStatsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=chat.d.ts.map