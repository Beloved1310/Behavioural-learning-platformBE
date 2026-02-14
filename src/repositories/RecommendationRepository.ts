import { FilterQuery, Types } from 'mongoose';
import { Recommendation } from '../models/Recommendation';
import { IRecommendation } from '../types';
import { BaseRepository } from './BaseRepository';

class RecommendationRepository extends BaseRepository<IRecommendation> {
  constructor() {
    super(Recommendation as any);
  }

  async findForUser(userId: string, type: string | undefined, limit: number) {
    const filter: any = {
      userId: new Types.ObjectId(userId),
      $or: [{ expiresAt: { $gte: new Date() } }, { expiresAt: { $exists: false } }],
    } as FilterQuery<IRecommendation>;
    if (type) filter.type = type;
    return this.find(filter, { sort: { priority: -1, generatedAt: -1 }, limit });
  }

  async markRead(id: string, userId: string) {
    return this.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any,
      { isRead: true } as any
    );
  }

  async markActioned(id: string, userId: string) {
    return this.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) } as any,
      { isActioned: true } as any
    );
  }
}

export const recommendationRepository = new RecommendationRepository();
export default recommendationRepository;
