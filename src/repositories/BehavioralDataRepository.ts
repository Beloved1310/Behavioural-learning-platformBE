import { FilterQuery, Types } from 'mongoose';
import { BehavioralData } from '../models/BehavioralData';
import { IBehavioralData } from '../types';
import { BaseRepository } from './BaseRepository';

class BehavioralDataRepository extends BaseRepository<IBehavioralData> {
  constructor() {
    super(BehavioralData as any);
  }

  async findSince(userId: string, startDate: Date) {
    return this.find({
      userId: new Types.ObjectId(userId),
      timestamp: { $gte: startDate },
    } as FilterQuery<IBehavioralData>);
  }
}

export const behavioralDataRepository = new BehavioralDataRepository();
export default behavioralDataRepository;
