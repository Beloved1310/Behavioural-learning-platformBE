import { Schema, model, Document } from 'mongoose';

export interface ITutorFeedback {
  tutorId: Schema.Types.ObjectId;
  comment: string;
  feedbackAt: Date;
  isRead: boolean;
}

export interface IReflectionEntry extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  date: Date;
  prompt: string;
  response: string;
  type: 'daily' | 'weekly' | 'session';
  mood?: string;
  tutorFeedback?: ITutorFeedback;
  createdAt: Date;
  updatedAt: Date;
}

const tutorFeedbackSchema = new Schema<ITutorFeedback>(
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

const reflectionEntrySchema = new Schema<IReflectionEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    prompt: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'session'],
      required: true,
    },
    mood: {
      type: String,
      trim: true,
    },
    tutorFeedback: {
      type: tutorFeedbackSchema,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

// For student's reflections sorted by date (most common query)
reflectionEntrySchema.index({ userId: 1, date: -1 });

// For filtering reflections by type and date
reflectionEntrySchema.index({ userId: 1, type: 1, date: -1 });

// For tutor's feedback queue (reflections awaiting feedback)
reflectionEntrySchema.index({ 'tutorFeedback.tutorId': 1 });

// For tutor's feedback queue sorted by date
reflectionEntrySchema.index({ 'tutorFeedback.tutorId': 1, date: -1 });

// For finding reflections without feedback (pending feedback queue)
reflectionEntrySchema.index({ userId: 1, tutorFeedback: 1, date: -1 });

export const ReflectionEntry = model<IReflectionEntry>('ReflectionEntry', reflectionEntrySchema);
