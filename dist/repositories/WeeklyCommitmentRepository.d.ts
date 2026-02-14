import { BaseRepository } from './BaseRepository';
import { IWeeklyCommitment } from '../models/WeeklyCommitment';
declare class WeeklyCommitmentRepository extends BaseRepository<IWeeklyCommitment> {
    constructor();
    findByUser(userId: string): Promise<IWeeklyCommitment[]>;
    findCurrentWeek(userId: string): Promise<IWeeklyCommitment | null>;
    private getWeekStart;
    private getWeekEnd;
    toggleCommitment(commitmentId: string, itemIndex: number): Promise<IWeeklyCommitment | null>;
    findByTutor(tutorId: string): Promise<IWeeklyCommitment[]>;
}
declare const _default: WeeklyCommitmentRepository;
export default _default;
//# sourceMappingURL=WeeklyCommitmentRepository.d.ts.map