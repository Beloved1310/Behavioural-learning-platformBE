import { Document } from 'mongoose';
import { Types } from 'mongoose';
export interface ITutorAvailability extends Document {
    _id: Types.ObjectId;
    tutorId: Types.ObjectId;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const TutorAvailability: import("mongoose").Model<ITutorAvailability, {}, {}, {}, Document<unknown, {}, ITutorAvailability, {}, {}> & ITutorAvailability & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=TutorAvailability.d.ts.map