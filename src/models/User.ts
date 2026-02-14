import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, SubscriptionTier } from '../types';

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    phoneNumber: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpiry: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordTokenExpiry: {
      type: Date,
      select: false,
    },
    subscriptionTier: {
      type: String,
      enum: Object.values(SubscriptionTier),
      default: SubscriptionTier.BASIC,
    },
    subscriptionStatus: {
      type: String,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    stripeCustomerId: {
      type: String,
    },

    // Student specific fields
    gradeLevel: {
      type: String,
    },
    learningStyle: {
      type: String,
    },
    academicGoals: {
      type: [String],
      default: [],
    },
    streakCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
    },

    // Tutor specific fields
    subjects: {
      type: [String],
      default: [],
    },
    hourlyRate: {
      type: Number,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: 1000,
    },
    qualifications: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalSessions: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBackgroundChecked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (_doc, ret) {
        const { password, ...rest } = ret;
        return rest;
      },
    },
  }
);

// Indexes for performance
// Note: email already has unique index from schema definition

// Single field indexes
userSchema.index({ role: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ subscriptionTier: 1 });
userSchema.index({ subjects: 1 });
userSchema.index({ rating: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Compound indexes for tutor-centric queries
// For finding verified, background-checked tutors sorted by rating
userSchema.index({ role: 1, isVerified: 1, isBackgroundChecked: 1, rating: -1 });

// For subject-based tutor search (e.g., find tutors teaching "Mathematics")
userSchema.index({ role: 1, subjects: 1 });

// For parent-child relationship queries
userSchema.index({ role: 1, parentId: 1 });

// For grade-based student filtering
userSchema.index({ role: 1, gradeLevel: 1 });

// Partial index for tutor-specific queries (only indexes tutor records)
// This improves performance for tutor queries while saving index space
userSchema.index(
  { subjects: 1, rating: -1, isVerified: 1 },
  {
    partialFilterExpression: { role: 'tutor' },
    name: 'tutor_subjects_rating_idx',
  }
);

// Partial index for student-specific queries (only indexes student records)
userSchema.index(
  { gradeLevel: 1, totalPoints: -1, streakCount: -1 },
  {
    partialFilterExpression: { role: 'student' },
    name: 'student_performance_idx',
  }
);

// Virtual for children (for parents)
userSchema.virtual('children', {
  ref: 'User',
  localField: '_id',
  foreignField: 'parentId',
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Instance method to check if user is a minor
userSchema.methods.isMinor = function () {
  if (!this.dateOfBirth) return false;
  const age = Math.floor(
    (Date.now() - this.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
  return age < 18;
};

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Hash password before saving (only if not already hashed)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
  if (this.password && /^\$2[ayb]\$.{56}$/.test(this.password)) {
    // Password is already hashed, skip hashing
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Static method to find tutors by subject
userSchema.statics.findTutorsBySubject = function (subject: string) {
  return this.find({
    role: UserRole.TUTOR,
    subjects: subject,
    isVerified: true,
    isBackgroundChecked: true,
  }).sort({ rating: -1 });
};

export const User = model<IUser>('User', userSchema);
