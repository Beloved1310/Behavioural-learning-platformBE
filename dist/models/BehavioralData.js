"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehavioralData = void 0;
const mongoose_1 = require("mongoose");
const behavioralDataSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionDuration: {
        type: Number,
        required: true,
        min: 0 // in seconds
    },
    actionsPerformed: {
        type: Number,
        required: true,
        min: 0
    },
    mood: {
        type: String,
        enum: ['happy', 'neutral', 'frustrated', 'confused']
    },
    engagementScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    pageViews: {
        type: mongoose_1.Schema.Types.Mixed // Store page view data as flexible object
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});
// Compound indexes for efficient queries
behavioralDataSchema.index({ userId: 1, timestamp: -1 });
behavioralDataSchema.index({ timestamp: -1 });
// Virtual to populate user details
behavioralDataSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
    select: 'firstName lastName email role'
});
// Static method to get user's behavioral data
behavioralDataSchema.statics.getUserData = function (userId, startDate, endDate) {
    const query = { userId };
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate)
            query.timestamp.$gte = startDate;
        if (endDate)
            query.timestamp.$lte = endDate;
    }
    return this.find(query).sort({ timestamp: -1 });
};
// Static method to get engagement analytics
behavioralDataSchema.statics.getEngagementAnalytics = function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose_1.Schema.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
                },
                averageEngagement: { $avg: '$engagementScore' },
                totalSessionTime: { $sum: '$sessionDuration' },
                totalActions: { $sum: '$actionsPerformed' },
                moodCounts: {
                    $push: '$mood'
                }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
};
// Static method to get mood distribution
behavioralDataSchema.statics.getMoodDistribution = function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose_1.Schema.Types.ObjectId(userId),
                timestamp: { $gte: startDate },
                mood: { $exists: true }
            }
        },
        {
            $group: {
                _id: '$mood',
                count: { $sum: 1 }
            }
        }
    ]);
};
// Static method to calculate average engagement score
behavioralDataSchema.statics.getAverageEngagement = function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose_1.Schema.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: null,
                averageEngagement: { $avg: '$engagementScore' },
                totalSessions: { $sum: 1 }
            }
        }
    ]);
};
exports.BehavioralData = (0, mongoose_1.model)('BehavioralData', behavioralDataSchema);
//# sourceMappingURL=BehavioralData.js.map