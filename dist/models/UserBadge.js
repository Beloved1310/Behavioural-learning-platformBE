"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBadge = void 0;
const mongoose_1 = require("mongoose");
const userBadgeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});
// Compound index to ensure uniqueness and efficient queries
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });
userBadgeSchema.index({ userId: 1, earnedAt: -1 });
// Virtual to populate badge details
userBadgeSchema.virtual('badge', {
    ref: 'Badge',
    localField: 'badgeId',
    foreignField: '_id',
    justOne: true
});
// Virtual to populate user details
userBadgeSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email'
});
// Static method to get user's badges
userBadgeSchema.statics.getUserBadges = function (userId) {
    return this.find({ userId })
        .populate('badge')
        .sort({ earnedAt: -1 });
};
// Static method to check if user has badge
userBadgeSchema.statics.hasUserEarnedBadge = function (userId, badgeId) {
    return this.exists({ userId, badgeId });
};
// Static method to get badge leaderboard
userBadgeSchema.statics.getBadgeLeaderboard = function (limit = 10) {
    return this.aggregate([
        {
            $group: {
                _id: '$userId',
                badgeCount: { $sum: 1 },
                latestBadge: { $max: '$earnedAt' }
            }
        },
        { $sort: { badgeCount: -1, latestBadge: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                    { $project: { firstName: 1, lastName: 1, profileImage: 1 } }
                ]
            }
        },
        { $unwind: '$user' }
    ]);
};
exports.UserBadge = (0, mongoose_1.model)('UserBadge', userBadgeSchema);
//# sourceMappingURL=UserBadge.js.map