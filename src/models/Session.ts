import { Schema, model } from 'mongoose';
import { ISession, SessionStatus } from '../types';

const sessionSchema = new Schema<ISession>({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tutorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 15,
    max: 180 // 3 hours max
  },
  status: {
    type: String,
    enum: Object.values(SessionStatus),
    default: SessionStatus.SCHEDULED
  },
  meetingUrl: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  notes: {
    type: String,
    maxlength: 2000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
sessionSchema.index({ studentId: 1, scheduledAt: -1 });
sessionSchema.index({ tutorId: 1, scheduledAt: -1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });
sessionSchema.index({ subject: 1, scheduledAt: -1 });

// Virtual to populate student and tutor details
sessionSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

sessionSchema.virtual('tutor', {
  ref: 'User',
  localField: 'tutorId',
  foreignField: '_id',
  justOne: true
});

// Instance method to check if session can be cancelled
sessionSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const sessionTime = new Date(this.scheduledAt);
  const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilSession > 2 && this.status === SessionStatus.SCHEDULED;
};

// Static method to find upcoming sessions
sessionSchema.statics.findUpcomingSessions = function(userId: string, role: 'student' | 'tutor') {
  const field = role === 'student' ? 'studentId' : 'tutorId';
  return this.find({
    [field]: userId,
    scheduledAt: { $gte: new Date() },
    status: { $in: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS] }
  }).sort({ scheduledAt: 1 });
};

export const Session = model<ISession>('Session', sessionSchema);