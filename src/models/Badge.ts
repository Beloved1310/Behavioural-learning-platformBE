import { Schema, model } from 'mongoose';
import { IBadge, BadgeType } from '../types';

const badgeSchema = new Schema<IBadge>({
  type: {
    type: String,
    enum: Object.values(BadgeType),
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true
  },
  requirement: {
    type: Number,
    required: true,
    min: 1
  },
  points: {
    type: Number,
    required: true,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Indexes for efficient queries
badgeSchema.index({ type: 1, isActive: 1 });
badgeSchema.index({ isActive: 1, createdAt: -1 });

// Static method to get active badges
badgeSchema.statics.getActiveBadges = function() {
  return this.find({ isActive: true }).sort({ type: 1, requirement: 1 });
};

// Static method to get badges by type
badgeSchema.statics.getBadgesByType = function(type: BadgeType) {
  return this.find({ type, isActive: true }).sort({ requirement: 1 });
};

export const Badge = model<IBadge>('Badge', badgeSchema);