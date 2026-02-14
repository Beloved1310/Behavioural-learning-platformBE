import { IRecommendation } from '../types';
import { BaseRepository } from './BaseRepository';
declare class RecommendationRepository extends BaseRepository<IRecommendation> {
    constructor();
    findForUser(userId: string, type: string | undefined, limit: number): Promise<IRecommendation[]>;
    markRead(id: string, userId: string): Promise<IRecommendation | null>;
    markActioned(id: string, userId: string): Promise<IRecommendation | null>;
}
export declare const recommendationRepository: RecommendationRepository;
export default recommendationRepository;
//# sourceMappingURL=RecommendationRepository.d.ts.map