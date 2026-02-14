import { BaseRepository } from './BaseRepository';
import { Goal, IGoal } from '../models/Goal';
import { Types } from 'mongoose';

class GoalRepository extends BaseRepository<IGoal> {
  constructor() {
    super(Goal);
  }

  async findByUser(userId: string, activeOnly: boolean = true) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (activeOnly) {
      filter.isActive = true;
    }
    return this.find(filter, { sort: { createdAt: -1 } });
  }

  async updateProgress(goalId: string, current: number) {
    const goal = await this.findById(goalId);
    if (!goal) return null;

    const oldCurrent = (goal as any).current;
    (goal as any).current = current;

    // Check for milestone achievements
    const milestones = (goal as any).milestones || [];
    const achievedMilestones = (goal as any).achievedMilestones || [];
    const progressPercent = (current / (goal as any).target) * 100;

    const newMilestones = milestones.filter((m: number) => {
      const milestonePercent = m;
      return progressPercent >= milestonePercent && !achievedMilestones.includes(m);
    });

    if (newMilestones.length > 0) {
      (goal as any).achievedMilestones = [...achievedMilestones, ...newMilestones];
    }

    await (goal as any).save();
    return goal;
  }

  async findByTutor(tutorId: string) {
    return this.find({ assignedBy: new Types.ObjectId(tutorId) } as any, {
      sort: { createdAt: -1 },
    });
  }
}

export default new GoalRepository();
