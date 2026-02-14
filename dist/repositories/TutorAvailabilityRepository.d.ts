import { BaseRepository } from './BaseRepository';
import { ITutorAvailability } from '../models/TutorAvailability';
import { Types } from 'mongoose';
declare class TutorAvailabilityRepository extends BaseRepository<ITutorAvailability> {
    constructor();
    findByTutor(tutorId: string, activeOnly?: boolean): Promise<(import("mongoose").Document<unknown, {}, ITutorAvailability, {}, {}> & ITutorAvailability & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    })[]>;
    findByTutorAndDay(tutorId: string, dayOfWeek: number, activeOnly?: boolean): Promise<ITutorAvailability[]>;
    findByTutorAndDate(tutorId: string, date: Date): Promise<ITutorAvailability[]>;
    deleteByTutor(tutorId: string): Promise<import("mongodb").DeleteResult>;
}
export declare const tutorAvailabilityRepository: TutorAvailabilityRepository;
export default tutorAvailabilityRepository;
//# sourceMappingURL=TutorAvailabilityRepository.d.ts.map