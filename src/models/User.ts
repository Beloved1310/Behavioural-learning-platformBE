import { Schema, model } from 'mongoose';
import { IUser, UserRole, SubscriptionTier } from '../types';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
    index: true
  },
  dateOfBirth: {
    type: Date
  },
  profileImage: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false,
    index: true
  },
  subscriptionTier: {
    type: String,
    enum: Object.values(SubscriptionTier),
    default: SubscriptionTier.BASIC,
    index: true
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Student specific fields
  academicGoals: {
    type: [String],
    default: []
  },
  streakCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  lastLoginAt: {
    type: Date
  },
  
  // Tutor specific fields
  subjects: {
    type: [String],
    default: []
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  qualifications: {
    type: [String],
    default: []
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  isBackgroundChecked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc, ret) {
      const { password, ...rest } = ret;
      return rest;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ subjects: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ createdAt: -1 });

// Virtual for children (for parents)
userSchema.virtual('children', {
  ref: 'User',
  localField: '_id',
  foreignField: 'parentId'
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method to check if user is a minor
userSchema.methods.isMinor = function() {
  if (!this.dateOfBirth) return false;
  const age = Math.floor((Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age < 18;
};

// Static method to find tutors by subject
userSchema.statics.findTutorsBySubject = function(subject: string) {
  return this.find({
    role: UserRole.TUTOR,
    subjects: subject,
    isVerified: true,
    isBackgroundChecked: true
  }).sort({ rating: -1 });
};

export const User = model<IUser>('User', userSchema);