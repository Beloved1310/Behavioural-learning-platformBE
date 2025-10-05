import Joi from 'joi';
export declare const createSessionSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updateSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getSessionsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getSessionByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const cancelSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const joinSessionSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const completeSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const rateSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const rescheduleSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getAvailabilitySchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const setAvailabilitySchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getSessionStatsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const searchSessionsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const reportSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const extendSessionSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=session.d.ts.map