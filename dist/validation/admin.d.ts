import Joi from 'joi';
export declare const approveTutorSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const rejectTutorSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const setBackgroundCheckStatusSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const updateUserStatusSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getPendingTutorsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getTutorByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getUserByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=admin.d.ts.map