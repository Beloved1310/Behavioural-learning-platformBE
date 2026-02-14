import { FilterQuery } from 'mongoose';
import { Badge } from '../models/Badge';
import { IBadge } from '../types';
import { BaseRepository } from './BaseRepository';

class BadgeRepository extends BaseRepository<IBadge> {
  constructor() {
    super(Badge as any);
  }

  async findActive() {
    return this.find({ isActive: true } as FilterQuery<IBadge>, {
      sort: { rarity: 1, pointsReward: 1 },
    });
  }
}

export const badgeRepository = new BadgeRepository();
export default badgeRepository;
