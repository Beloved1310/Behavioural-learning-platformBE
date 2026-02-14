import { FilterQuery, Types } from 'mongoose';
import { UserBadge } from '../models/UserBadge';
import { IUserBadge } from '../types';
import { BaseRepository } from './BaseRepository';

class UserBadgeRepository extends BaseRepository<IUserBadge> {
  constructor() {
    super(UserBadge as any);
  }

  async findForUser(userId: string) {
    return (UserBadge as any)
      .find({ userId: new Types.ObjectId(userId) })
      .populate('badgeId')
      .sort({ earnedAt: -1 });
  }
}

export const userBadgeRepository = new UserBadgeRepository();
export default userBadgeRepository;
