import { FilterQuery, Types } from 'mongoose';
import { CustomEvent } from '../models/CustomEvent';
import { ICustomEvent } from '../types';
import { BaseRepository } from './BaseRepository';

class CustomEventRepository extends BaseRepository<ICustomEvent> {
  constructor() {
    super(CustomEvent as any);
  }

  async createEvent(data: Partial<ICustomEvent>) {
    return this.create(data as any);
  }

  async getHistory(userId: string, eventType: string | undefined, limit: number) {
    const filter: any = { userId: new Types.ObjectId(userId) } as FilterQuery<ICustomEvent>;
    if (eventType) filter.eventType = eventType;
    return this.find(filter, { sort: { timestamp: -1 }, limit });
  }

  async getCounts(userId: string, days: number) {
    return (CustomEvent as any).getEventCounts(userId, days);
  }

  async getPageViews(userId: string, days: number) {
    return (CustomEvent as any).getPageViews(userId, days);
  }
}

export const customEventRepository = new CustomEventRepository();
export default customEventRepository;
