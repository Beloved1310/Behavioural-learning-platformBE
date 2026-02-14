import { FilterQuery } from 'mongoose';
import { Quiz } from '../models/Quiz';
import { IQuiz } from '../types';
import { BaseRepository } from './BaseRepository';

class QuizRepository extends BaseRepository<IQuiz> {
  constructor() {
    super(Quiz as any);
  }

  async findActive(filter: FilterQuery<IQuiz> = {}) {
    return this.find({ isActive: true, ...filter } as FilterQuery<IQuiz>, {
      sort: { createdAt: -1 },
    });
  }

  async findActiveById(id: string) {
    return this.findOne({ _id: id, isActive: true } as FilterQuery<IQuiz>);
  }
}

export const quizRepository = new QuizRepository();
export default quizRepository;
