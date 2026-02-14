import { Schema, model, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface ITutorAvailability extends Document {
  _id: Types.ObjectId;
  tutorId: Types.ObjectId;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // Format: "HH:mm" (24-hour, e.g., "09:00")
  endTime: string; // Format: "HH:mm" (24-hour, e.g., "17:00")
  isRecurring: boolean; // If true, repeats weekly
  specificDate?: Date; // If not recurring, specific date for this availability
  isActive: boolean; // Can be temporarily disabled
  createdAt: Date;
  updatedAt: Date;
}

const tutorAvailabilitySchema = new Schema<ITutorAvailability>(
  {
    tutorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          // Validate HH:mm format
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'startTime must be in HH:mm format (24-hour)',
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'endTime must be in HH:mm format (24-hour)',
      },
    },
    isRecurring: {
      type: Boolean,
      default: true,
      index: true,
    },
    specificDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
tutorAvailabilitySchema.index({ tutorId: 1, dayOfWeek: 1, isActive: 1 });
tutorAvailabilitySchema.index({ tutorId: 1, isRecurring: 1, isActive: 1 });
tutorAvailabilitySchema.index({ tutorId: 1, specificDate: 1, isActive: 1 });

// Ensure no duplicate recurring availability for same day/time
tutorAvailabilitySchema.index(
  { tutorId: 1, dayOfWeek: 1, startTime: 1, endTime: 1, isRecurring: 1 },
  { unique: true, partialFilterExpression: { isRecurring: true } }
);

export const TutorAvailability = model<ITutorAvailability>(
  'TutorAvailability',
  tutorAvailabilitySchema
);
