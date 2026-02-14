import { FilterQuery } from 'mongoose';
import { IQuiz } from '../types';
import { BaseRepository } from './BaseRepository';
declare class QuizRepository extends BaseRepository<IQuiz> {
    constructor();
    findActive(filter?: FilterQuery<IQuiz>): Promise<IQuiz[]>;
    findActiveById(id: string): Promise<IQuiz | null>;
}
export declare const quizRepository: QuizRepository;
export default quizRepository;
//# sourceMappingURL=QuizRepository.d.ts.map