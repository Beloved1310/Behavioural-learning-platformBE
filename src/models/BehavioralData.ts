import { Schema, model } from 'mongoose';
import { IBehavioralData } from '../types';

const behavioralDataSchema = new Schema<IBehavioralData>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionDuration: {
      type: Number,
      required: true,
      min: 0, // in seconds
    },
    actionsPerformed: {
      type: Number,
      required: true,
      min: 0,
    },
    mood: {
      type: String,
      enum: ['happy', 'neutral', 'frustrated', 'confused'],
    },
    engagementScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    pageViews: {
      type: Schema.Types.Mixed, // Store page view data as flexible object
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Compound indexes for efficient queries

// For user's behavioral data sorted by timestamp (most common query)
behavioralDataSchema.index({ userId: 1, timestamp: -1 });

// For time-based queries across all users
behavioralDataSchema.index({ timestamp: -1 });

// For engagement score analysis by user
behavioralDataSchema.index({ userId: 1, engagementScore: -1, timestamp: -1 });

// For mood-based queries (if mood tracking is used)
behavioralDataSchema.index({ userId: 1, mood: 1, timestamp: -1 });

// Virtual to populate user details
behavioralDataSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  select: 'firstName lastName email role',
});

// Static method to get user's behavioral data
behavioralDataSchema.statics.getUserData = function (
  userId: string,
  startDate?: Date,
  endDate?: Date
) {
  const query: any = { userId };

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }

  return this.find(query).sort({ timestamp: -1 });
};

// Static method to get engagement analytics
behavioralDataSchema.statics.getEngagementAnalytics = function (userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        },
        averageEngagement: { $avg: '$engagementScore' },
        totalSessionTime: { $sum: '$sessionDuration' },
        totalActions: { $sum: '$actionsPerformed' },
        moodCounts: {
          $push: '$mood',
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

// Static method to calculate average engagement score
behavioralDataSchema.statics.getAverageEngagement = function (userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new Schema.Types.ObjectId(userId),
        timestamp: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        averageEngagement: { $avg: '$engagementScore' },
        totalSessions: { $sum: 1 },
      },
    },
  ]);
};

export const BehavioralData = model<IBehavioralData>('BehavioralData', behavioralDataSchema);
