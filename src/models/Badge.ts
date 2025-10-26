import { Schema, model } from 'mongoose';
import { IBadge, BadgeType, BadgeCategory, BadgeRarity } from '../types';

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
  category: {
    type: String,
    enum: Object.values(BadgeCategory),
    required: true,
    index: true
  },
  rarity: {
    type: String,
    enum: Object.values(BadgeRarity),
    required: true,
    default: BadgeRarity.COMMON
  },
  criteria: {
    type: {
      type: String,
      enum: ['quiz_score', 'quiz_count', 'streak', 'points', 'perfect_score'],
      required: true
    },
    threshold: {
      type: Number,
      required: true,
      min: 1
    },
    subject: {
      type: String
    }
  },
  requirement: {
    type: Number,
    required: true,
    min: 1
  },
  pointsReward: {
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