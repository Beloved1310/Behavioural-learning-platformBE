import { IMoodLog } from '../types';
import { BaseRepository } from './BaseRepository';
declare class MoodLogRepository extends BaseRepository<IMoodLog> {
    constructor();
    createLog(data: Partial<IMoodLog>): Promise<IMoodLog>;
    findSince(userId: string, startDate: Date, limit: number): Promise<IMoodLog[]>;
    getDistribution(userId: string, days: number): Promise<any>;
    getTrends(userId: string, days: number): Promise<any>;
}
export declare const moodLogRepository: MoodLogRepository;
export default moodLogRepository;
//# sourceMappingURL=MoodLogRepository.d.ts.map