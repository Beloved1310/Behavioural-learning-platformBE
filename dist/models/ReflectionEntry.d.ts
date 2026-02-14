import { Schema, Document } from 'mongoose';
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
export declare const ReflectionEntry: import("mongoose").Model<IReflectionEntry, {}, {}, {}, Document<unknown, {}, IReflectionEntry, {}, {}> & IReflectionEntry & Required<{
    _id: Schema.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ReflectionEntry.d.ts.map