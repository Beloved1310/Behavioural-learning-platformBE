import { BaseRepository } from './BaseRepository';
import { IReflectionEntry } from '../models/ReflectionEntry';
declare class ReflectionEntryRepository extends BaseRepository<IReflectionEntry> {
    constructor();
    findByUser(userId: string, limit?: number): Promise<IReflectionEntry[]>;
    findByPeriod(userId: string, startDate: Date, endDate: Date): Promise<IReflectionEntry[]>;
    findToday(userId: string): Promise<IReflectionEntry | null>;
    findByWeek(userId: string): Promise<IReflectionEntry[]>;
    getReflectionStreak(userId: string): Promise<number>;
    addTutorFeedback(reflectionId: string, tutorId: string, comment: string): Promise<IReflectionEntry | null>;
}
declare const _default: ReflectionEntryRepository;
export default _default;
//# sourceMappingURL=ReflectionEntryRepository.d.ts.map