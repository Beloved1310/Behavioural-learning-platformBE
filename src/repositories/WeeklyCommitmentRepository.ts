import { BaseRepository } from './BaseRepository';
import { WeeklyCommitment, IWeeklyCommitment } from '../models/WeeklyCommitment';
import { Types } from 'mongoose';

class WeeklyCommitmentRepository extends BaseRepository<IWeeklyCommitment> {
  constructor() {
    super(WeeklyCommitment);
  }

  async findByUser(userId: string) {
    return this.find({ userId: new Types.ObjectId(userId) }, { sort: { weekStart: -1 } });
  }

  async findCurrentWeek(userId: string) {
    const now = new Date();
    const weekStart = this.getWeekStart(now);

    const weekStartDate = new Date(weekStart);
    weekStartDate.setHours(0, 0, 0, 0);

    return this.findOne({
      userId: new Types.ObjectId(userId),
      weekStart: {
        $gte: new Date(weekStartDate.getTime()),
        $lt: new Date(weekStartDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      },
    } as any);
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  async toggleCommitment(commitmentId: string, itemIndex: number) {
    const commitment = await this.findById(commitmentId);
    if (!commitment) return null;

    const items = (commitment as any).commitments;
    if (itemIndex >= 0 && itemIndex < items.length) {
      items[itemIndex].completed = !items[itemIndex].completed;
      if (items[itemIndex].completed) {
        items[itemIndex].completedAt = new Date();
      } else {
        items[itemIndex].completedAt = undefined;
      }
      await (commitment as any).save();
    }

    return commitment;
  }

  async findByTutor(tutorId: string) {
    return this.find({ assignedBy: new Types.ObjectId(tutorId) }, { sort: { weekStart: -1 } });
  }
}

export default new WeeklyCommitmentRepository();
