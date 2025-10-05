import Joi from 'joi';
export declare const createQuizSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updateQuizSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getQuizzesSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getQuizByIdSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const deleteQuizSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const submitQuizAttemptSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getQuizAttemptsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getQuizAttemptByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getQuizStatsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const getStudentQuizProgressSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const reviewQuizAttemptSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const getPracticeQuestionsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const duplicateQuizSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
export declare const importQuizSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const exportQuizSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=quiz.d.ts.map