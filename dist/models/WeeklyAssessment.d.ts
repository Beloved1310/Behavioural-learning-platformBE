import { Schema, Document } from 'mongoose';
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
    weekRating: number;
    whatWentWell: string;
    challenges: string;
    nextWeekFocus: string;
    commitmentLevel: number;
    tutorFeedback?: ITutorAssessmentFeedback;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const WeeklyAssessment: import("mongoose").Model<IWeeklyAssessment, {}, {}, {}, Document<unknown, {}, IWeeklyAssessment, {}, {}> & IWeeklyAssessment & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=WeeklyAssessment.d.ts.map