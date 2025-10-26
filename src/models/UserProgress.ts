import { Schema, model } from 'mongoose';
import { IUserProgress } from '../types';

const userProgressSchema = new Schema<IUserProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  currentXP: {
    type: Number,
    default: 0,
    min: 0
  },
  nextLevelXP: {
    type: Number,
    default: 100
  },
  completedQuizzes: {
    type: Number,
    default: 0,
    min: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  studyTime: {
    type: Number, // in minutes
    default: 0,
    min: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness and efficient queries
userProgressSchema.index({ userId: 1, subject: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, lastActivity: -1 });

// Virtual to populate user details
userProgressSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  select: 'firstName lastName email'
});

// Static method to get user's progress across all subjects
userProgressSchema.statics.getUserProgress = function(userId: string) {
  return this.find({ userId }).sort({ subject: 1 });
};

// Static method to get leaderboard for a subject
userProgressSchema.statics.getSubjectLeaderboard = function(subject: string, limit: number = 10) {
  return this.find({ subject })
    .populate('userId', 'firstName lastName profileImage')
    .sort({ level: -1, currentXP: -1 })
    .limit(limit);
};

// Instance method to add XP and level up if necessary
userProgressSchema.methods.addXP = function(xp: number) {
  this.currentXP += xp;

  // Level up logic
  while (this.currentXP >= this.nextLevelXP) {
    this.currentXP -= this.nextLevelXP;
    this.level += 1;
    // Increase XP needed for next level (e.g., 20% more each level)
    this.nextLevelXP = Math.floor(this.nextLevelXP * 1.2);
  }

  this.lastActivity = new Date();
  return this.save();
};

export const UserProgress = model<IUserProgress>('UserProgress', userProgressSchema);
