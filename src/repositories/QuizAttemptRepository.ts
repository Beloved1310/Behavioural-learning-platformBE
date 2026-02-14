import { Types } from 'mongoose';
import { QuizAttempt } from '../models/QuizAttempt';
import { IQuizAttempt } from '../types';
import { BaseRepository } from './BaseRepository';

class QuizAttemptRepository extends BaseRepository<IQuizAttempt> {
  constructor() {
    super(QuizAttempt as any);
  }

  async aggregateStats(userId: string, startDate: Date) {
    return QuizAttempt.aggregate([
      { $match: { studentId: new Types.ObjectId(userId), completedAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalTimeSpent: { $sum: '$timeSpent' },
        },
      },
    ]);
  }
}

export const quizAttemptRepository = new QuizAttemptRepository();
export default quizAttemptRepository;
