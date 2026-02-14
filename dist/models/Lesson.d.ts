import { Document, Types } from 'mongoose';
export declare enum LessonType {
    VIDEO = "video",
    TEXT = "text"
}
export interface ILesson extends Document {
    _id: Types.ObjectId;
    title: string;
    subject: string;
    topic: string;
    type: LessonType;
    description: string;
    content: {
        videoUrl?: string;
        videoPlatform?: 'youtube' | 'vimeo';
        textContent?: string;
    };
    estimatedDuration: number;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Lesson: import("mongoose").Model<ILesson, {}, {}, {}, Document<unknown, {}, ILesson, {}, {}> & ILesson & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Lesson.d.ts.map