import { FilterQuery } from 'mongoose';
import { ILesson } from '../models/Lesson';
import { BaseRepository } from './BaseRepository';
declare class LessonRepository extends BaseRepository<ILesson> {
    constructor();
    /**
     * Find active lessons by subject
     */
    findBySubject(subject: string): Promise<ILesson[]>;
    /**
     * Find active lessons by subject and topic
     */
    findBySubjectAndTopic(subject: string, topic: string): Promise<ILesson[]>;
    /**
     * Find active lesson by ID
     */
    findActiveById(id: string): Promise<ILesson | null>;
    /**
     * Get all active lessons
     */
    findActive(filters?: FilterQuery<ILesson>): Promise<ILesson[]>;
}
export declare const lessonRepository: LessonRepository;
export default lessonRepository;
//# sourceMappingURL=LessonRepository.d.ts.map