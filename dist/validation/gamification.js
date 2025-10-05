"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeChallengeSchema = exports.joinChallengeSchema = exports.getChallengesSchema = exports.bulkAwardBadgesSchema = exports.getBadgeProgressSchema = exports.checkBadgeEligibilitySchema = exports.getGamificationStatsSchema = exports.createAchievementSchema = exports.getAchievementsSchema = exports.updateStreakSchema = exports.getStreakInfoSchema = exports.deductPointsSchema = exports.addPointsSchema = exports.getUserPointsSchema = exports.getLeaderboardSchema = exports.getUserBadgesSchema = exports.revokeBadgeSchema = exports.awardBadgeSchema = exports.deleteBadgeSchema = exports.getBadgeByIdSchema = exports.getBadgesSchema = exports.updateBadgeSchema = exports.createBadgeSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const common_1 = require("./common");
// Create badge validation
exports.createBadgeSchema = {
    body: joi_1.default.object({
        type: common_1.commonFields.badgeType.required(),
        name: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Badge name is required'
        }),
        description: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Badge description is required'
        }),
        icon: joi_1.default.string().max(10).required().messages({
            'string.empty': 'Badge icon is required',
            'string.max': 'Icon should be a short emoji or symbol'
        }),
        requirement: joi_1.default.number().integer().min(1).required().messages({
            'number.min': 'Requirement must be at least 1',
            'any.required': 'Requirement value is required'
        }),
        points: common_1.commonFields.points.required(),
        isActive: common_1.commonFields.boolean.default(true)
    })
};
// Update badge validation
exports.updateBadgeSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        name: common_1.commonFields.shortText,
        description: common_1.commonFields.mediumText,
        icon: joi_1.default.string().max(10),
        requirement: joi_1.default.number().integer().min(1),
        points: common_1.commonFields.points,
        isActive: common_1.commonFields.boolean
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};
// Get badges validation
exports.getBadgesSchema = {
    query: common_1.paginationSchema.keys({
        type: common_1.commonFields.badgeType.optional(),
        isActive: common_1.commonFields.boolean.optional(),
        earned: common_1.commonFields.boolean.optional() // Filter by user's earned badges
    })
};
// Get badge by ID validation
exports.getBadgeByIdSchema = {
    params: common_1.idParamSchema
};
// Delete badge validation
exports.deleteBadgeSchema = {
    params: common_1.idParamSchema
};
// Award badge to user validation
exports.awardBadgeSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        badgeId: common_1.commonFields.objectId.required(),
        reason: common_1.commonFields.mediumText.optional()
    })
};
// Revoke badge from user validation
exports.revokeBadgeSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        badgeId: common_1.commonFields.objectId.required(),
        reason: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Reason for revoking badge is required'
        })
    })
};
// Get user badges validation
exports.getUserBadgesSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: common_1.paginationSchema.keys({
        type: common_1.commonFields.badgeType.optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Get leaderboard validation
exports.getLeaderboardSchema = {
    query: common_1.paginationSchema.keys({
        type: joi_1.default.string().valid('points', 'badges', 'streak', 'quiz_scores').default('points'),
        period: joi_1.default.string().valid('week', 'month', 'year', 'all_time').default('month'),
        subject: common_1.commonFields.subject.optional(),
        role: common_1.commonFields.userRole.optional()
    })
};
// Get user points validation
exports.getUserPointsSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        detailed: common_1.commonFields.boolean.default(false),
        period: joi_1.default.string().valid('week', 'month', 'year').default('month')
    })
};
// Add points to user validation
exports.addPointsSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        points: joi_1.default.number().integer().min(1).max(1000).required().messages({
            'number.min': 'Points must be at least 1',
            'number.max': 'Cannot add more than 1000 points at once'
        }),
        reason: joi_1.default.string().valid('quiz_completion', 'perfect_quiz', 'daily_login', 'study_session', 'streak_bonus', 'badge_earned', 'session_attendance', 'manual_award', 'other').required(),
        description: common_1.commonFields.mediumText.optional()
    })
};
// Deduct points from user validation
exports.deductPointsSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        points: joi_1.default.number().integer().min(1).max(1000).required().messages({
            'number.min': 'Points must be at least 1',
            'number.max': 'Cannot deduct more than 1000 points at once'
        }),
        reason: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Reason for deducting points is required'
        })
    })
};
// Get streak information validation
exports.getStreakInfoSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        detailed: common_1.commonFields.boolean.default(false)
    })
};
// Update streak validation
exports.updateStreakSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        action: joi_1.default.string().valid('increment', 'reset', 'set').required(),
        value: joi_1.default.when('action', {
            is: 'set',
            then: joi_1.default.number().integer().min(0).required(),
            otherwise: joi_1.default.forbidden()
        })
    })
};
// Get achievements validation
exports.getAchievementsSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: common_1.paginationSchema.keys({
        category: joi_1.default.string().valid('recent', 'badges', 'milestones', 'streaks').optional(),
        startDate: joi_1.default.date().iso().optional(),
        endDate: joi_1.default.date().iso().min(joi_1.default.ref('startDate')).optional()
    })
};
// Create custom achievement validation
exports.createAchievementSchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        title: common_1.commonFields.shortText.required().messages({
            'string.empty': 'Achievement title is required'
        }),
        description: common_1.commonFields.mediumText.required().messages({
            'string.empty': 'Achievement description is required'
        }),
        icon: joi_1.default.string().max(10).required(),
        points: common_1.commonFields.points.required(),
        category: joi_1.default.string().valid('academic', 'behavioral', 'social', 'milestone', 'special').required()
    })
};
// Get gamification statistics validation
exports.getGamificationStatsSchema = {
    query: joi_1.default.object({
        period: joi_1.default.string().valid('week', 'month', 'year').default('month'),
        userId: common_1.commonFields.objectId.optional(),
        detailed: common_1.commonFields.boolean.default(false)
    })
};
// Check badge eligibility validation
exports.checkBadgeEligibilitySchema = {
    body: joi_1.default.object({
        userId: common_1.commonFields.objectId.required(),
        badgeId: common_1.commonFields.objectId.optional(), // Check specific badge or all badges
        autoAward: common_1.commonFields.boolean.default(false)
    })
};
// Get progress towards badges validation
exports.getBadgeProgressSchema = {
    params: joi_1.default.object({
        userId: common_1.commonFields.objectId.required()
    }),
    query: joi_1.default.object({
        unearned: common_1.commonFields.boolean.default(true), // Show progress for unearned badges
        type: common_1.commonFields.badgeType.optional()
    })
};
// Bulk award badges validation
exports.bulkAwardBadgesSchema = {
    body: joi_1.default.object({
        awards: joi_1.default.array().items(joi_1.default.object({
            userId: common_1.commonFields.objectId.required(),
            badgeId: common_1.commonFields.objectId.required(),
            reason: common_1.commonFields.mediumText.optional()
        })).min(1).max(100).required().messages({
            'array.min': 'At least one badge award is required',
            'array.max': 'Cannot award more than 100 badges at once'
        })
    })
};
// Get challenge information validation
exports.getChallengesSchema = {
    query: common_1.paginationSchema.keys({
        active: common_1.commonFields.boolean.default(true),
        difficulty: joi_1.default.string().valid('easy', 'medium', 'hard').optional(),
        category: joi_1.default.string().valid('daily', 'weekly', 'monthly', 'special').optional()
    })
};
// Join challenge validation
exports.joinChallengeSchema = {
    params: common_1.idParamSchema
};
// Complete challenge validation
exports.completeChallengeSchema = {
    params: common_1.idParamSchema,
    body: joi_1.default.object({
        evidence: common_1.commonFields.longText.optional(),
        attachments: joi_1.default.array().items(common_1.commonFields.url).max(5).optional()
    })
};
//# sourceMappingURL=gamification.js.map