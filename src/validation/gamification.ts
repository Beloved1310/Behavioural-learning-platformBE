import Joi from 'joi';
import { commonFields, paginationSchema, idParamSchema } from './common';

// Create badge validation
export const createBadgeSchema = {
  body: Joi.object({
    type: commonFields.badgeType.required(),
    name: commonFields.shortText.required().messages({
      'string.empty': 'Badge name is required'
    }),
    description: commonFields.mediumText.required().messages({
      'string.empty': 'Badge description is required'
    }),
    icon: Joi.string().max(10).required().messages({
      'string.empty': 'Badge icon is required',
      'string.max': 'Icon should be a short emoji or symbol'
    }),
    requirement: Joi.number().integer().min(1).required().messages({
      'number.min': 'Requirement must be at least 1',
      'any.required': 'Requirement value is required'
    }),
    points: commonFields.points.required(),
    isActive: commonFields.boolean.default(true)
  })
};

// Update badge validation
export const updateBadgeSchema = {
  params: idParamSchema,
  body: Joi.object({
    name: commonFields.shortText,
    description: commonFields.mediumText,
    icon: Joi.string().max(10),
    requirement: Joi.number().integer().min(1),
    points: commonFields.points,
    isActive: commonFields.boolean
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

// Get badges validation
export const getBadgesSchema = {
  query: paginationSchema.keys({
    type: commonFields.badgeType.optional(),
    isActive: commonFields.boolean.optional(),
    earned: commonFields.boolean.optional() // Filter by user's earned badges
  })
};

// Get badge by ID validation
export const getBadgeByIdSchema = {
  params: idParamSchema
};

// Delete badge validation
export const deleteBadgeSchema = {
  params: idParamSchema
};

// Award badge to user validation
export const awardBadgeSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    badgeId: commonFields.objectId.required(),
    reason: commonFields.mediumText.optional()
  })
};

// Revoke badge from user validation
export const revokeBadgeSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    badgeId: commonFields.objectId.required(),
    reason: commonFields.mediumText.required().messages({
      'string.empty': 'Reason for revoking badge is required'
    })
  })
};

// Get user badges validation
export const getUserBadgesSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: paginationSchema.keys({
    type: commonFields.badgeType.optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Get leaderboard validation
export const getLeaderboardSchema = {
  query: paginationSchema.keys({
    type: Joi.string().valid('points', 'badges', 'streak', 'quiz_scores').default('points'),
    period: Joi.string().valid('week', 'month', 'year', 'all_time').default('month'),
    subject: commonFields.subject.optional(),
    role: commonFields.userRole.optional()
  })
};

// Get user points validation
export const getUserPointsSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    detailed: commonFields.boolean.default(false),
    period: Joi.string().valid('week', 'month', 'year').default('month')
  })
};

// Add points to user validation
export const addPointsSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    points: Joi.number().integer().min(1).max(1000).required().messages({
      'number.min': 'Points must be at least 1',
      'number.max': 'Cannot add more than 1000 points at once'
    }),
    reason: Joi.string().valid(
      'quiz_completion',
      'perfect_quiz',
      'daily_login',
      'study_session',
      'streak_bonus',
      'badge_earned',
      'session_attendance',
      'manual_award',
      'other'
    ).required(),
    description: commonFields.mediumText.optional()
  })
};

// Deduct points from user validation
export const deductPointsSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    points: Joi.number().integer().min(1).max(1000).required().messages({
      'number.min': 'Points must be at least 1',
      'number.max': 'Cannot deduct more than 1000 points at once'
    }),
    reason: commonFields.mediumText.required().messages({
      'string.empty': 'Reason for deducting points is required'
    })
  })
};

// Get streak information validation
export const getStreakInfoSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    detailed: commonFields.boolean.default(false)
  })
};

// Update streak validation
export const updateStreakSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    action: Joi.string().valid('increment', 'reset', 'set').required(),
    value: Joi.when('action', {
      is: 'set',
      then: Joi.number().integer().min(0).required(),
      otherwise: Joi.forbidden()
    })
  })
};

// Get achievements validation
export const getAchievementsSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: paginationSchema.keys({
    category: Joi.string().valid('recent', 'badges', 'milestones', 'streaks').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
  })
};

// Create custom achievement validation
export const createAchievementSchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    title: commonFields.shortText.required().messages({
      'string.empty': 'Achievement title is required'
    }),
    description: commonFields.mediumText.required().messages({
      'string.empty': 'Achievement description is required'
    }),
    icon: Joi.string().max(10).required(),
    points: commonFields.points.required(),
    category: Joi.string().valid('academic', 'behavioral', 'social', 'milestone', 'special').required()
  })
};

// Get gamification statistics validation
export const getGamificationStatsSchema = {
  query: Joi.object({
    period: Joi.string().valid('week', 'month', 'year').default('month'),
    userId: commonFields.objectId.optional(),
    detailed: commonFields.boolean.default(false)
  })
};

// Check badge eligibility validation
export const checkBadgeEligibilitySchema = {
  body: Joi.object({
    userId: commonFields.objectId.required(),
    badgeId: commonFields.objectId.optional(), // Check specific badge or all badges
    autoAward: commonFields.boolean.default(false)
  })
};

// Get progress towards badges validation
export const getBadgeProgressSchema = {
  params: Joi.object({
    userId: commonFields.objectId.required()
  }),
  query: Joi.object({
    unearned: commonFields.boolean.default(true), // Show progress for unearned badges
    type: commonFields.badgeType.optional()
  })
};

// Bulk award badges validation
export const bulkAwardBadgesSchema = {
  body: Joi.object({
    awards: Joi.array().items(
      Joi.object({
        userId: commonFields.objectId.required(),
        badgeId: commonFields.objectId.required(),
        reason: commonFields.mediumText.optional()
      })
    ).min(1).max(100).required().messages({
      'array.min': 'At least one badge award is required',
      'array.max': 'Cannot award more than 100 badges at once'
    })
  })
};

// Get challenge information validation
export const getChallengesSchema = {
  query: paginationSchema.keys({
    active: commonFields.boolean.default(true),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
    category: Joi.string().valid('daily', 'weekly', 'monthly', 'special').optional()
  })
};

// Join challenge validation
export const joinChallengeSchema = {
  params: idParamSchema
};

// Complete challenge validation
export const completeChallengeSchema = {
  params: idParamSchema,
  body: Joi.object({
    evidence: commonFields.longText.optional(),
    attachments: Joi.array().items(commonFields.url).max(5).optional()
  })
};