"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCustomDashboardSchema = exports.createCustomDashboardSchema = exports.getABTestResultsSchema = exports.getConversionFunnelSchema = exports.getRetentionAnalyticsSchema = exports.getMoodAnalyticsSchema = exports.exportAnalyticsSchema = exports.getPerformanceInsightsSchema = exports.getLearningPatternsSchema = exports.getUserEngagementSchema = exports.getPlatformAnalyticsSchema = exports.getProgressReportByIdSchema = exports.getProgressReportsSchema = exports.generateProgressReportSchema = exports.getBehavioralDataSchema = exports.recordBehavioralDataSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Record behavioral data validation
exports.recordBehavioralDataSchema = {
    body: joi_1.default.object({
        sessionDuration: joi_1.default.number().integer().min(1).required().messages({
            'number.min': 'Session duration must be at least 1 second'
        }),
        actionsPerformed: joi_1.default.number().integer().min(0).required(),
        mood: joi_1.default.string().valid('happy', 'neutral', 'frustrated', 'confused').optional(),
        engagementScore: joi_1.default.number().min(0).max(100).required().messages({
            'number.min': 'Engagement score cannot be negative',
            'number.max': 'Engagement score cannot exceed 100'
        }),
        pageViews: joi_1.default.object({
            pages: joi_1.default.array().items(joi_1.default.object({
                path: joi_1.default.string().required(),
                timeSpent: joi_1.default.number().integer().min(0).required(),
                interactions: joi_1.default.number().integer().min(0).default(0)
            })).optional(),
            totalPages: joi_1.default.number().integer().min(0).optional()
        }).optional(),
        context: joi_1.default.object({
            deviceType: joi_1.default.string().valid('desktop', 'tablet', 'mobile').optional(),
            browserType: joi_1.default.string().optional(),
            screenResolution: joi_1.default.string().optional(),
            timezone: common_1.commonFields.timezone.optional()
        }).optional()
    })
};
// Get behavioral data validation
exports.getBehavioralDataSchema = {
    query: common_1.paginationSchema.keys({
        userId: common_1.commonFields.objectId.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        mood: joi_1.default.string().valid('happy', 'neutral', 'frustrated', 'confused').optional(),
        minEngagement: joi_1.default.number().min(0).max(100).optional(),
        maxEngagement: joi_1.default.number().min(0).max(100).optional(),
        groupBy: joi_1.default.string().valid('hour', 'day', 'week').default('day')
    })
};
// Generate progress report validation
exports.generateProgressReportSchema = {
    body: joi_1.default.object({
        studentId: common_1.commonFields.objectId.required(),
        period: joi_1.default.string().valid('weekly', 'monthly').required(),
        startDate: joi_1.default.date().iso().required(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).required(),
        includeComparisons: common_1.commonFields.boolean.default(true),
        includePredictions: common_1.commonFields.boolean.default(true),
        customMetrics: joi_1.default.array().items(joi_1.default.string().valid('study_consistency', 'improvement_rate', 'subject_performance', 'engagement_trends', 'goal_progress')).optional()
    })
};
// Get progress reports validation
exports.getProgressReportsSchema = {
    query: common_1.paginationSchema.keys({
        studentId: common_1.commonFields.objectId.optional(),
        period: joi_1.default.string().valid('weekly', 'monthly').optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Get progress report by ID validation
exports.getProgressReportByIdSchema = {
    params: common_1.idParamSchema
};
// Get platform analytics validation (admin only)
exports.getPlatformAnalyticsSchema = {
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'quarter', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        metrics: joi_1.default.array().items(joi_1.default.string().valid('user_growth', 'engagement_metrics', 'session_analytics', 'revenue_metrics', 'content_performance', 'retention_rates', 'geographic_distribution')).optional(),
        granularity: joi_1.default.string().valid('hour', 'day', 'week', 'month').default('day')
    })
};
// Get user engagement analytics validation
exports.getUserEngagementSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'quarter', 'year').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        includeComparisons: common_1.commonFields.boolean.default(false),
        detailed: common_1.commonFields.boolean.default(false)
    })
};
// Get learning patterns validation
exports.getLearningPatternsSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        analysisType: joi_1.default.string().valid('time_preferences', 'subject_affinity', 'learning_style', 'difficulty_progression', 'attention_patterns').optional(),
        period: joi_1.default.string().valid('month', 'quarter', 'year').default('quarter'),
        minDataPoints: joi_1.default.number().integer().min(5).default(10)
    })
};
// Get performance insights validation
exports.getPerformanceInsightsSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        subject: common_1.commonFields.subject.optional(),
        insightType: joi_1.default.string().valid('strengths_weaknesses', 'improvement_areas', 'learning_velocity', 'retention_analysis', 'goal_tracking').optional(),
        period: joi_1.default.string().valid('month', 'quarter', 'year').default('quarter')
    })
};
// Export analytics data validation
exports.exportAnalyticsSchema = {
    body: joi_1.default.object({
        dataType: joi_1.default.string().valid('behavioral_data', 'progress_reports', 'user_engagement', 'platform_metrics', 'session_analytics').required(),
        format: joi_1.default.string().valid('csv', 'json', 'xlsx').default('csv'),
        filters: joi_1.default.object({
            userIds: joi_1.default.array().items(common_1.commonFields.objectId).max(100).optional(),
            startDate: joi_1.default.date().iso().optional(),
            endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
            includePersonalData: common_1.commonFields.boolean.default(false)
        }).optional(),
        compression: common_1.commonFields.boolean.default(false)
    })
};
// Get mood analytics validation
exports.getMoodAnalyticsSchema = {
    query: joi_1.default.object({
        userId: common_1.commonFields.objectId.optional(),
        period: joi_1.default.string().valid('week', 'month', 'quarter').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        groupBy: joi_1.default.string().valid('day', 'week', 'subject', 'time_of_day').default('day'),
        includeCorrelations: common_1.commonFields.boolean.default(false)
    })
};
// Get retention analytics validation
exports.getRetentionAnalyticsSchema = {
    query: joi_1.default.object({
        cohortType: joi_1.default.string().valid('registration', 'first_session', 'subscription').default('registration'),
        period: joi_1.default.string().valid('day', 'week', 'month').default('week'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        userSegment: joi_1.default.string().valid('all', 'students', 'tutors', 'premium', 'basic').default('all')
    })
};
// Get conversion funnel validation
exports.getConversionFunnelSchema = {
    query: joi_1.default.object({
        funnelType: joi_1.default.string().valid('registration_to_first_session', 'free_to_premium', 'session_booking_to_completion', 'quiz_start_to_completion').required(),
        period: joi_1.default.string().valid('week', 'month', 'quarter').default('month'),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional(),
        segmentBy: joi_1.default.string().valid('age_group', 'subject', 'source', 'device_type').optional()
    })
};
// Get A/B test results validation
exports.getABTestResultsSchema = {
    params: joi_1.default.object({
        testId: joi_1.default.string().required()
    }),
    query: joi_1.default.object({
        metric: joi_1.default.string().valid('conversion_rate', 'engagement_time', 'completion_rate', 'retention_rate').optional(),
        significance: joi_1.default.number().min(0.8).max(0.99).default(0.95),
        minSampleSize: joi_1.default.number().integer().min(100).default(1000)
    })
};
// Create custom dashboard validation
exports.createCustomDashboardSchema = {
    body: joi_1.default.object({
        name: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Dashboard name is required'
        }),
        description: common_1.commonFields.mediumText.optional(),
        widgets: joi_1.default.array().items(joi_1.default.object({
            type: joi_1.default.string().valid('line_chart', 'bar_chart', 'pie_chart', 'metric_card', 'table', 'heatmap').required(),
            title: common_1.commonFields.shortText.required(),
            dataSource: joi_1.default.string().required(),
            filters: joi_1.default.object().optional(),
            position: joi_1.default.object({
                x: joi_1.default.number().integer().min(0).required(),
                y: joi_1.default.number().integer().min(0).required(),
                width: joi_1.default.number().integer().min(1).max(12).required(),
                height: joi_1.default.number().integer().min(1).max(12).required()
            }).required()
        })).min(1).max(20).required(),
        isPublic: common_1.commonFields.boolean.default(false),
        refreshInterval: joi_1.default.number().integer().min(60).max(3600).default(300) // seconds
    })
};
// Update custom dashboard validation
exports.updateCustomDashboardSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        name: common_1.commonFields.shortText,
        description: common_1.commonFields.mediumText.allow(''),
        widgets: joi_1.default.array().items(joi_1.default.object({
            id: common_1.commonFields.objectId.optional(),
            type: joi_1.default.string().valid('line_chart', 'bar_chart', 'pie_chart', 'metric_card', 'table', 'heatmap').required(),
            title: common_1.commonFields.shortText.required(),
            dataSource: joi_1.default.string().required(),
            filters: joi_1.default.object().optional(),
            position: joi_1.default.object({
                x: joi_1.default.number().integer().min(0).required(),
                y: joi_1.default.number().integer().min(0).required(),
                width: joi_1.default.number().integer().min(1).max(12).required(),
                height: joi_1.default.number().integer().min(1).max(12).required()
            }).required()
        })).min(1).max(20),
        isPublic: common_1.commonFields.boolean,
        refreshInterval: joi_1.default.number().integer().min(60).max(3600)
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
//# sourceMappingURL=analytics.js.map