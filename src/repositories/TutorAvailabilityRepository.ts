import { BaseRepository } from './BaseRepository';
import { TutorAvailability, ITutorAvailability } from '../models/TutorAvailability';
import { Types } from 'mongoose';

class TutorAvailabilityRepository extends BaseRepository<ITutorAvailability> {
  constructor() {
    super(TutorAvailability);
  }

  async findByTutor(tutorId: string, activeOnly: boolean = true) {
    const filter: any = { tutorId: new Types.ObjectId(tutorId) };
    if (activeOnly) {
      filter.isActive = true;
    }

    return this.model.find(filter).sort({ dayOfWeek: 1, startTime: 1 });
  }

  async findByTutorAndDay(tutorId: string, dayOfWeek: number, activeOnly: boolean = true) {
    const filter: any = {
      tutorId: new Types.ObjectId(tutorId),
      dayOfWeek,
    };
    if (activeOnly) {
      filter.isActive = true;
    }
    return this.find(filter, { sort: { startTime: 1 } });
  }

  async findByTutorAndDate(tutorId: string, date: Date) {
    const dayOfWeek = date.getDay();
    const filter: any = {
      tutorId: new Types.ObjectId(tutorId),
      $or: [
        { isRecurring: true, dayOfWeek, isActive: true },
        { specificDate: date, isActive: true },
      ],
    };
    return this.find(filter, { sort: { startTime: 1 } });
  }

  async deleteByTutor(tutorId: string) {
    return this.model.deleteMany({ tutorId: new Types.ObjectId(tutorId) });
  }
}

export const tutorAvailabilityRepository = new TutorAvailabilityRepository();
export default tutorAvailabilityRepository;
