import { IProgressReport } from '../types';
import { BaseRepository } from './BaseRepository';
declare class ProgressReportRepository extends BaseRepository<IProgressReport> {
    constructor();
    findForUser(userId: string, period: 'weekly' | 'monthly' | undefined, limit: number): Promise<IProgressReport[]>;
}
export declare const progressReportRepository: ProgressReportRepository;
export default progressReportRepository;
//# sourceMappingURL=ProgressReportRepository.d.ts.map