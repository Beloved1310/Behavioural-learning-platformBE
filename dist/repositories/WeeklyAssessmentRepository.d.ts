import { BaseRepository } from './BaseRepository';
import { IWeeklyAssessment } from '../models/WeeklyAssessment';
declare class WeeklyAssessmentRepository extends BaseRepository<IWeeklyAssessment> {
    constructor();
    findByUser(userId: string, limit?: number): Promise<IWeeklyAssessment[]>;
    findCurrentWeek(userId: string): Promise<IWeeklyAssessment | null>;
    getTrends(userId: string, weeks?: number): Promise<{
        weekRatings: {
            week: any;
            rating: any;
        }[];
        commitmentLevels: {
            week: any;
            level: any;
        }[];
    }>;
    addTutorFeedback(assessmentId: string, tutorId: string, comment: string, encouragementLevel?: 'low' | 'medium' | 'high'): Promise<IWeeklyAssessment | null>;
    private getWeekStart;
}
declare const _default: WeeklyAssessmentRepository;
export default _default;
//# sourceMappingURL=WeeklyAssessmentRepository.d.ts.map