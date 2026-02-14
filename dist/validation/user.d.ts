import Joi from 'joi';
export declare const getUsersSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getUserByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const updateUserSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const deleteUserSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getTutorsBySubjectSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const uploadAvatarSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const followUserSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getUserStatsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const blockUserSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const reportUserSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const searchUsersSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getUserChildrenSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const addChildSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updateChildSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getUserNotificationsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const markNotificationReadSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const updateProfileSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updatePasswordSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const deleteAccountSchema: {
    body: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=user.d.ts.map