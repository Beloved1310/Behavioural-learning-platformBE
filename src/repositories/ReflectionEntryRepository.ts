import { BaseRepository } from './BaseRepository';
import { ReflectionEntry, IReflectionEntry } from '../models/ReflectionEntry';
import { Types } from 'mongoose';

class ReflectionEntryRepository extends BaseRepository<IReflectionEntry> {
  constructor() {
    super(ReflectionEntry);
  }

  async findByUser(userId: string, limit?: number) {
    const options: any = { sort: { date: -1 } };
    if (limit) {
      options.limit = limit;
    }
    return this.find({ userId: new Types.ObjectId(userId) }, options);
  }

  async findByPeriod(userId: string, startDate: Date, endDate: Date) {
    return this.find(
      {
        userId: new Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
      },
      { sort: { date: -1 } }
    );
  }

  async findToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.findOne({
      userId: new Types.ObjectId(userId),
      date: { $gte: today, $lt: tomorrow },
      type: 'daily',
    });
  }

  async findByWeek(userId: string) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    return this.findByPeriod(userId, weekStart, now);
  }

  async getReflectionStreak(userId: string): Promise<number> {
    const reflections = await this.findByUser(userId, 30); // Check last 30 days
    if (reflections.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = new Set(
      reflections.map((r: any) => {
        const date = new Date(r.date);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let checkDate = new Date(today);
    while (dates.has(checkDate.getTime())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
  }

  async addTutorFeedback(reflectionId: string, tutorId: string, comment: string) {
    const reflection = await this.findById(reflectionId);
    if (!reflection) return null;

    (reflection as any).tutorFeedback = {
      tutorId: new Types.ObjectId(tutorId),
      comment,
      feedbackAt: new Date(),
      isRead: false,
    };

    await (reflection as any).save();
    return reflection;
  }
}

export default new ReflectionEntryRepository();
