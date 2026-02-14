import { IQuizAttempt } from '../types';
import { BaseRepository } from './BaseRepository';
declare class QuizAttemptRepository extends BaseRepository<IQuizAttempt> {
    constructor();
    aggregateStats(userId: string, startDate: Date): Promise<any[]>;
}
export declare const quizAttemptRepository: QuizAttemptRepository;
export default quizAttemptRepository;
//# sourceMappingURL=QuizAttemptRepository.d.ts.map