import { Schema, model, Document } from 'mongoose';

export interface ITutorAssessmentFeedback {
  tutorId: Schema.Types.ObjectId;
  comment: string;
  encouragementLevel: 'low' | 'medium' | 'high';
  feedbackAt: Date;
  isRead: boolean;
}

export interface IWeeklyAssessment extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  weekStart: Date;
  weekRating: number; // 1-5
  whatWentWell: string;
  challenges: string;
  nextWeekFocus: string;
  commitmentLevel: number; // 1-5
  tutorFeedback?: ITutorAssessmentFeedback;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const tutorAssessmentFeedbackSchema = new Schema<ITutorAssessmentFeedback>(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    encouragementLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    feedbackAt: {
      type: Date,
      default: Date.now,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const weeklyAssessmentSchema = new Schema<IWeeklyAssessment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
    weekRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    whatWentWell: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    challenges: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    nextWeekFocus: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    commitmentLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    tutorFeedback: {
      type: tutorAssessmentFeedbackSchema,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

// For student's assessments sorted by week
weeklyAssessmentSchema.index({ userId: 1, weekStart: -1 });

// For student's assessments sorted by completion date
weeklyAssessmentSchema.index({ userId: 1, completedAt: -1 });

// For tutor's feedback queue (assessments awaiting feedback)
weeklyAssessmentSchema.index({ 'tutorFeedback.tutorId': 1 });

// For tutor's feedback queue sorted by date
weeklyAssessmentSchema.index({ 'tutorFeedback.tutorId': 1, completedAt: -1 });

// For finding assessments without feedback (pending feedback queue)
weeklyAssessmentSchema.index({ userId: 1, tutorFeedback: 1, completedAt: -1 });

// Ensure one assessment per user per week (unique constraint)
weeklyAssessmentSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyAssessment = model<IWeeklyAssessment>(
  'WeeklyAssessment',
  weeklyAssessmentSchema
);
