import { Types } from 'mongoose';
import { Session } from '../models/Session';
import { ISession } from '../types';
import { BaseRepository } from './BaseRepository';

class SessionRepository extends BaseRepository<ISession> {
  constructor() {
    super(Session as any);
  }

  async aggregateStudyStats(userId: string, startDate: Date) {
    return Session.aggregate([
      { $match: { studentId: new Types.ObjectId(userId), scheduledAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalDuration: { $sum: '$duration' },
        },
      },
    ]);
  }

  async dailyPattern(userId: string, startDate: Date) {
    return Session.aggregate([
      {
        $match: {
          studentId: new Types.ObjectId(userId),
          scheduledAt: { $gte: startDate },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
          sessionCount: { $sum: 1 },
          totalMinutes: { $sum: '$duration' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async weeklyPattern(userId: string, startDate: Date) {
    return Session.aggregate([
      {
        $match: {
          studentId: new Types.ObjectId(userId),
          scheduledAt: { $gte: startDate },
          status: 'completed',
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: '$scheduledAt' },
          sessionCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

export const sessionRepository = new SessionRepository();
export default sessionRepository;
