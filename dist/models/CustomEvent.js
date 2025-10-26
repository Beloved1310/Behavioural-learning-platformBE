"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomEvent = void 0;
const mongoose_1 = require("mongoose");
const customEventSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventType: {
        type: String,
        required: true,
        index: true
    },
    eventData: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    page: {
        type: String
    },
    sessionId: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});
// Compound indexes for efficient queries
customEventSchema.index({ userId: 1, timestamp: -1 });
customEventSchema.index({ userId: 1, eventType: 1 });
customEventSchema.index({ eventType: 1, timestamp: -1 });
// Static method to get event counts by type
customEventSchema.statics.getEventCounts = function (userId, days = 30) {
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
                _id: '$eventType',
                count: { $sum: 1 },
                lastOccurrence: { $max: '$timestamp' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};
// Static method to get events by type
customEventSchema.statics.getEventsByType = function (userId, eventType, limit = 50) {
    return this.find({
        userId: new mongoose_1.Schema.Types.ObjectId(userId),
        eventType
    })
        .sort({ timestamp: -1 })
        .limit(limit);
};
// Static method to get page views
customEventSchema.statics.getPageViews = function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.aggregate([
        {
            $match: {
                userId: new mongoose_1.Schema.Types.ObjectId(userId),
                eventType: 'page_view',
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$eventData.page',
                views: { $sum: 1 },
                lastVisit: { $max: '$timestamp' }
            }
        },
        {
            $sort: { views: -1 }
        }
    ]);
};
exports.CustomEvent = (0, mongoose_1.model)('CustomEvent', customEventSchema);
//# sourceMappingURL=CustomEvent.js.map