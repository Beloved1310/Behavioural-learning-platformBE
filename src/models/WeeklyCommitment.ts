import { Schema, model, Document } from 'mongoose';

export interface ICommitmentItem {
  text: string;
  type: 'time' | 'quizzes' | 'sessions';
  target: number; // 30 minutes, 3 quizzes, etc.
  completed: boolean;
  completedAt?: Date;
}

export interface IWeeklyCommitment extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  weekStart: Date; // Monday of the week
  weekEnd: Date;
  commitments: ICommitmentItem[];
  assignedBy?: Schema.Types.ObjectId; // Tutor who assigned it (optional)
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commitmentItemSchema = new Schema<ICommitmentItem>(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ['time', 'quizzes', 'sessions'],
      required: true,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const weeklyCommitmentSchema = new Schema<IWeeklyCommitment>(
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
    weekEnd: {
      type: Date,
      required: true,
    },
    commitments: {
      type: [commitmentItemSchema],
      required: true,
      validate: {
        validator: function (v: ICommitmentItem[]) {
          return v.length > 0 && v.length <= 5; // 1-5 commitments per week
        },
        message: 'Must have between 1 and 5 commitments',
      },
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

// For student's commitments sorted by week
weeklyCommitmentSchema.index({ userId: 1, weekStart: -1 });
weeklyCommitmentSchema.index({ userId: 1, weekEnd: -1 });

// For tutor's assigned commitments
weeklyCommitmentSchema.index({ assignedBy: 1 });

// For tutor's assigned commitments sorted by week
weeklyCommitmentSchema.index({ assignedBy: 1, weekStart: -1 });

// Ensure one commitment per user per week (unique constraint)
weeklyCommitmentSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export const WeeklyCommitment = model<IWeeklyCommitment>(
  'WeeklyCommitment',
  weeklyCommitmentSchema
);
