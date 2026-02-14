import { BaseRepository } from './BaseRepository';
import { IGoal } from '../models/Goal';
declare class GoalRepository extends BaseRepository<IGoal> {
    constructor();
    findByUser(userId: string, activeOnly?: boolean): Promise<IGoal[]>;
    updateProgress(goalId: string, current: number): Promise<IGoal | null>;
    findByTutor(tutorId: string): Promise<IGoal[]>;
}
declare const _default: GoalRepository;
export default _default;
//# sourceMappingURL=GoalRepository.d.ts.map