import { FilterQuery, Types } from 'mongoose';
import { UserProgress } from '../models/UserProgress';
import { IUserProgress } from '../types';
import { BaseRepository } from './BaseRepository';

class UserProgressRepository extends BaseRepository<IUserProgress> {
  constructor() {
    super(UserProgress as any);
  }

  async findByUser(userId: string) {
    return this.find({ userId: new Types.ObjectId(userId) } as FilterQuery<IUserProgress>, {
      sort: { subject: 1 },
    });
  }

  async findByUserAndSubject(userId: string, subject: string) {
    return this.findOne({
      userId: new Types.ObjectId(userId),
      subject,
    } as FilterQuery<IUserProgress>);
  }
}

export const userProgressRepository = new UserProgressRepository();
export default userProgressRepository;
