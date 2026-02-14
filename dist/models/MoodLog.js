"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodLog = void 0;
const mongoose_1 = require("mongoose");
const moodLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mood: {
        type: String,
        enum: ['happy', 'sad', 'angry', 'anxious', 'excited', 'calm', 'frustrated', 'confused', 'confident', 'neutral'],
        required: true
    },
    intensity: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    context: {
        type: String
    },
    tags: {
        type: [String],
        default: []
    },
    notes: {
        type: String,
        maxlength: 500
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Indexes for performance
moodLogSchema.index({ userId: 1, timestamp: -1 });
moodLogSchema.index({ mood: 1 });
moodLogSchema.index({ timestamp: -1 });
// Static method to get mood distribution for a user
moodLogSchema.statics.getMoodDistribution = function (userId, days = 30) {
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
                _id: '$mood',
                count: { $sum: 1 },
                averageIntensity: { $avg: '$intensity' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};
// Static method to get mood trends over time
moodLogSchema.statics.getMoodTrends = function (userId, days = 30) {
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
                moods: {
                    $push: {
                        mood: '$mood',
                        intensity: '$intensity'
                    }
                },
                averageIntensity: { $avg: '$intensity' }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);
};
exports.MoodLog = (0, mongoose_1.model)('MoodLog', moodLogSchema);
//# sourceMappingURL=MoodLog.js.map