import { ISession } from '../types';
import { BaseRepository } from './BaseRepository';
declare class SessionRepository extends BaseRepository<ISession> {
    constructor();
    aggregateStudyStats(userId: string, startDate: Date): Promise<any[]>;
    dailyPattern(userId: string, startDate: Date): Promise<any[]>;
    weeklyPattern(userId: string, startDate: Date): Promise<any[]>;
}
export declare const sessionRepository: SessionRepository;
export default sessionRepository;
//# sourceMappingURL=SessionRepository.d.ts.map