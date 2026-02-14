import { Schema, Document } from 'mongoose';
export interface IGoal extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    title: string;
    description?: string;
    target: number;
    current: number;
    deadline?: Date;
    milestones: number[];
    achievedMilestones: number[];
    assignedBy?: Schema.Types.ObjectId;
    assignedAt?: Date;
    status: 'active' | 'pending_approval' | 'rejected';
    tutorFeedback?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Goal: import("mongoose").Model<IGoal, {}, {}, {}, Document<unknown, {}, IGoal, {}, {}> & IGoal & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Goal.d.ts.map