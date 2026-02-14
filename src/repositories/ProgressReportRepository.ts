import { FilterQuery, Types } from 'mongoose';
import { ProgressReport } from '../models/ProgressReport';
import { IProgressReport } from '../types';
import { BaseRepository } from './BaseRepository';

class ProgressReportRepository extends BaseRepository<IProgressReport> {
  constructor() {
    super(ProgressReport as any);
  }

  async findForUser(userId: string, period: 'weekly' | 'monthly' | undefined, limit: number) {
    const filter: any = { studentId: new Types.ObjectId(userId) } as FilterQuery<IProgressReport>;
    if (period) filter.period = period;
    return this.find(filter, { sort: { generatedAt: -1 }, limit });
  }
}

export const progressReportRepository = new ProgressReportRepository();
export default progressReportRepository;
