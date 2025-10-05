import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Record behavioral data validation
export const recordBehavioralDataSchema = {
  body: Joi.object({
    sessionDuration: Joi.number().integer().min(1).required().messages({
      'number.min': 'Session duration must be at least 1 second'
    }),
    actionsPerformed: Joi.number().integer().min(0).required(),
    mood: Joi.string().valid('happy', 'neutral', 'frustrated', 'confused').optional(),
    engagementScore: Joi.number().min(0).max(100).required().messages({
      'number.min': 'Engagement score cannot be negative',
      'number.max': 'Engagement score cannot exceed 100'
    }),
    pageViews: Joi.object({
      pages: Joi.array().items(
        Joi.object({
          path: Joi.string().required(),
          timeSpent: Joi.number().integer().min(0).required(),
          interactions: Joi.number().integer().min(0).default(0)
        })
      ).optional(),
      totalPages: Joi.number().integer().min(0).optional()
    }).optional(),
    context: Joi.object({
      deviceType: Joi.string().valid('desktop', 'tablet', 'mobile').optional(),
      browserType: Joi.string().optional(),
      screenResolution: Joi.string().optional(),
      timezone: commonFields.timezone.optional()
    }).optional()
  })
};

// Get behavioral data validation
export const getBehavioralDataSchema = {
  query: paginationSchema.keys({
    userId: commonFields.objectId.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    mood: Joi.string().valid('happy', 'neutral', 'frustrated', 'confused').optional(),
    minEngagement: Joi.number().min(0).max(100).optional(),
    maxEngagement: Joi.number().min(0).max(100).optional(),
    groupBy: Joi.string().valid('hour', 'day', 'week').default('day')
  })
};

// Generate progress report validation
export const generateProgressReportSchema = {
  body: Joi.object({
    studentId: commonFields.objectId.required(),
    period: Joi.string().valid('weekly', 'monthly').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeComparisons: commonFields.boolean.default(true),
    includePredictions: commonFields.boolean.default(true),
    customMetrics: Joi.array().items(
      Joi.string().valid(
        'study_consistency',
        'improvement_rate',
        'subject_performance',
        'engagement_trends',
        'goal_progress'
      )
    ).optional()
  })
};

// Get progress reports validation
export const getProgressReportsSchema = {
  query: paginationSchema.keys({
    studentId: commonFields.objectId.optional(),
    period: Joi.string().valid('weekly', 'monthly').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Get progress report by ID validation
export const getProgressReportByIdSchema = {
  params: idParamSchema
};

// Get platform analytics validation (admin only)
export const getPlatformAnalyticsSchema = {
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    metrics: Joi.array().items(
      Joi.string().valid(
        'user_growth',
        'engagement_metrics',
        'session_analytics',
        'revenue_metrics',
        'content_performance',
        'retention_rates',
        'geographic_distribution'
      )
    ).optional(),
    granularity: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
  })
};

// Get user engagement analytics validation
export const getUserEngagementSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'quarter', 'year').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    includeComparisons: commonFields.boolean.default(false),
    detailed: commonFields.boolean.default(false)
  })
};

// Get learning patterns validation
export const getLearningPatternsSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    analysisType: Joi.string().valid(
      'time_preferences',
      'subject_affinity',
      'learning_style',
      'difficulty_progression',
      'attention_patterns'
    ).optional(),
    period: Joi.string().valid('month', 'quarter', 'year').default('quarter'),
    minDataPoints: Joi.number().integer().min(5).default(10)
  })
};

// Get performance insights validation
export const getPerformanceInsightsSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    subject: commonFields.subject.optional(),
    insightType: Joi.string().valid(
      'strengths_weaknesses',
      'improvement_areas',
      'learning_velocity',
      'retention_analysis',
      'goal_tracking'
    ).optional(),
    period: Joi.string().valid('month', 'quarter', 'year').default('quarter')
  })
};

// Export analytics data validation
export const exportAnalyticsSchema = {
  body: Joi.object({
    dataType: Joi.string().valid(
      'behavioral_data',
      'progress_reports',
      'user_engagement',
      'platform_metrics',
      'session_analytics'
    ).required(),
    format: Joi.string().valid('csv', 'json', 'xlsx').default('csv'),
    filters: Joi.object({
      userIds: Joi.array().items(commonFields.objectId).max(100).optional(),
      startDate: Joi.date().iso().optional(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
      includePersonalData: commonFields.boolean.default(false)
    }).optional(),
    compression: commonFields.boolean.default(false)
  })
};

// Get mood analytics validation
export const getMoodAnalyticsSchema = {
  query: Joi.object({
    userId: commonFields.objectId.optional(),
    period: Joi.string().valid('week', 'month', 'quarter').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    groupBy: Joi.string().valid('day', 'week', 'subject', 'time_of_day').default('day'),
    includeCorrelations: commonFields.boolean.default(false)
  })
};

// Get retention analytics validation
export const getRetentionAnalyticsSchema = {
  query: Joi.object({
    cohortType: Joi.string().valid('registration', 'first_session', 'subscription').default('registration'),
    period: Joi.string().valid('day', 'week', 'month').default('week'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    userSegment: Joi.string().valid('all', 'students', 'tutors', 'premium', 'basic').default('all')
  })
};

// Get conversion funnel validation
export const getConversionFunnelSchema = {
  query: Joi.object({
    funnelType: Joi.string().valid(
      'registration_to_first_session',
      'free_to_premium',
      'session_booking_to_completion',
      'quiz_start_to_completion'
    ).required(),
    period: Joi.string().valid('week', 'month', 'quarter').default('month'),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    segmentBy: Joi.string().valid('age_group', 'subject', 'source', 'device_type').optional()
  })
};

// Get A/B test results validation
export const getABTestResultsSchema = {
  params: Joi.object({
    testId: Joi.string().required()
  }),
  query: Joi.object({
    metric: Joi.string().valid(
      'conversion_rate',
      'engagement_time',
      'completion_rate',
      'retention_rate'
    ).optional(),
    significance: Joi.number().min(0.8).max(0.99).default(0.95),
    minSampleSize: Joi.number().integer().min(100).default(1000)
  })
};

// Create custom dashboard validation
export const createCustomDashboardSchema = {
  body: Joi.object({
    name: commonFields.shortText.required().messages({
      'string.empty': 'Dashboard name is required'
    }),
    description: commonFields.mediumText.optional(),
    widgets: Joi.array().items(
      Joi.object({
        type: Joi.string().valid(
          'line_chart',
          'bar_chart',
          'pie_chart',
          'metric_card',
          'table',
          'heatmap'
        ).required(),
        title: commonFields.shortText.required(),
        dataSource: Joi.string().required(),
        filters: Joi.object().optional(),
        position: Joi.object({
          x: Joi.number().integer().min(0).required(),
          y: Joi.number().integer().min(0).required(),
          width: Joi.number().integer().min(1).max(12).required(),
          height: Joi.number().integer().min(1).max(12).required()
        }).required()
      })
    ).min(1).max(20).required(),
    isPublic: commonFields.boolean.default(false),
    refreshInterval: Joi.number().integer().min(60).max(3600).default(300) // seconds
  })
};

// Update custom dashboard validation
export const updateCustomDashboardSchema = {
  params: idParamSchema,
  body: Joi.object({
    name: commonFields.shortText,
    description: commonFields.mediumText.allow(''),
    widgets: Joi.array().items(
      Joi.object({
        id: commonFields.objectId.optional(),
        type: Joi.string().valid(
          'line_chart',
          'bar_chart',
          'pie_chart',
          'metric_card',
          'table',
          'heatmap'
        ).required(),
        title: commonFields.shortText.required(),
        dataSource: Joi.string().required(),
        filters: Joi.object().optional(),
        position: Joi.object({
          x: Joi.number().integer().min(0).required(),
          y: Joi.number().integer().min(0).required(),
          width: Joi.number().integer().min(1).max(12).required(),
          height: Joi.number().integer().min(1).max(12).required()
        }).required()
      })
    ).min(1).max(20),
    isPublic: commonFields.boolean,
    refreshInterval: Joi.number().integer().min(60).max(3600)
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};