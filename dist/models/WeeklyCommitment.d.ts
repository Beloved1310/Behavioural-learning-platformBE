import { Schema, Document } from 'mongoose';
export interface ICommitmentItem {
    text: string;
    type: 'time' | 'quizzes' | 'sessions';
    target: number;
    completed: boolean;
    completedAt?: Date;
}
export interface IWeeklyCommitment extends Document {
    _id: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    weekStart: Date;
    weekEnd: Date;
    commitments: ICommitmentItem[];
    assignedBy?: Schema.Types.ObjectId;
    assignedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WeeklyCommitment: import("mongoose").Model<IWeeklyCommitment, {}, {}, {}, Document<unknown, {}, IWeeklyCommitment, {}, {}> & IWeeklyCommitment & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=WeeklyCommitment.d.ts.map