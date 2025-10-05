import Joi from 'joi';
export declare const recordBehavioralDataSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getBehavioralDataSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const generateProgressReportSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getProgressReportsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getProgressReportByIdSchema: {
    params: Joi.ObjectSchema<any>;
};
export declare const getPlatformAnalyticsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getUserEngagementSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const getLearningPatternsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const getPerformanceInsightsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const exportAnalyticsSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const getMoodAnalyticsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getRetentionAnalyticsSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getConversionFunnelSchema: {
    query: Joi.ObjectSchema<any>;
};
export declare const getABTestResultsSchema: {
    params: Joi.ObjectSchema<any>;
    query: Joi.ObjectSchema<any>;
};
export declare const createCustomDashboardSchema: {
    body: Joi.ObjectSchema<any>;
};
export declare const updateCustomDashboardSchema: {
    params: Joi.ObjectSchema<any>;
    body: Joi.ObjectSchema<any>;
};
//# sourceMappingURL=analytics.d.ts.map