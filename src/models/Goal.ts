import { Schema, model, Document } from 'mongoose';

export interface IGoal extends Document {
  _id: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  target: number; // e.g., "Complete 50 quizzes"
  current: number; // Current progress
  deadline?: Date;
  milestones: number[]; // e.g., [10, 25, 50] for celebration points
  achievedMilestones: number[]; // Milestones already reached
  assignedBy?: Schema.Types.ObjectId; // Tutor who assigned it (optional)
  assignedAt?: Date;
  status: 'active' | 'pending_approval' | 'rejected'; // Approval status for student-initiated goals
  tutorFeedback?: string; // Feedback from tutor when rejecting
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    current: {
      type: Number,
      default: 0,
      min: 0,
    },
    deadline: {
      type: Date,
    },
    milestones: {
      type: [Number],
      default: [25, 50, 75, 100], // Default milestones at 25%, 50%, 75%, 100%
    },
    achievedMilestones: {
      type: [Number],
      default: [],
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'pending_approval', 'rejected'],
      default: 'active', // Tutor-assigned goals are active, student-initiated need approval
    },
    tutorFeedback: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

// For student's active goals (most common query)
goalSchema.index({ userId: 1, isActive: 1 });

// For student's goals sorted by creation date
goalSchema.index({ userId: 1, createdAt: -1 });

// For tutor's assigned goals
goalSchema.index({ assignedBy: 1 });

// Compound index for active goals with status (for filtering active vs pending)
goalSchema.index({ userId: 1, isActive: 1, status: 1 });

// For tutor's pending approval queue (tutor-centric feature)
goalSchema.index({ assignedBy: 1, status: 1 });

// For student's pending goals awaiting approval
goalSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const Goal = model<IGoal>('Goal', goalSchema);
