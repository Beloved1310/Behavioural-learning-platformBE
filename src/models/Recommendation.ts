import { Schema, model } from 'mongoose';
import { IRecommendation } from '../types';

const recommendationSchema = new Schema<IRecommendation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['content', 'study_time', 'break', 'technique', 'goal'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isActioned: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
recommendationSchema.index({ userId: 1, generatedAt: -1 });
recommendationSchema.index({ userId: 1, isRead: 1 });
recommendationSchema.index({ userId: 1, type: 1 });
recommendationSchema.index({ expiresAt: 1 });

// Static method to get active recommendations
recommendationSchema.statics.getActiveRecommendations = function(userId: string, limit: number = 10) {
  const now = new Date();

  return this.find({
    userId: new Schema.Types.ObjectId(userId),
    $or: [
      { expiresAt: { $gte: now } },
      { expiresAt: { $exists: false } }
    ]
  })
    .sort({ priority: -1, generatedAt: -1 })
    .limit(limit);
};

// Static method to mark recommendation as read
recommendationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  return await this.save();
};

// Static method to mark recommendation as actioned
recommendationSchema.methods.markAsActioned = async function() {
  this.isActioned = true;
  return await this.save();
};

export const Recommendation = model<IRecommendation>('Recommendation', recommendationSchema);
