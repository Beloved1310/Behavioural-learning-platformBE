import { Schema, model } from 'mongoose';
import { ICustomEvent } from '../types';

const customEventSchema = new Schema<ICustomEvent>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventData: {
    type: Schema.Types.Mixed,
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
customEventSchema.statics.getEventCounts = function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
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
customEventSchema.statics.getEventsByType = function(userId: string, eventType: string, limit: number = 50) {
  return this.find({
    userId: new Schema.Types.ObjectId(userId),
    eventType
  })
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get page views
customEventSchema.statics.getPageViews = function(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
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

export const CustomEvent = model<ICustomEvent>('CustomEvent', customEventSchema);
