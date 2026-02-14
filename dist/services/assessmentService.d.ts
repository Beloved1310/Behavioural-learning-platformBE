export declare class AssessmentService {
    /**
     * Get current week's assessment for a user
     */
    getCurrentAssessment(userId: string): Promise<{
        id: any;
        weekStart: any;
        weekRating: any;
        whatWentWell: any;
        challenges: any;
        nextWeekFocus: any;
        commitmentLevel: any;
        tutorFeedback: any;
        completedAt: any;
    } | null>;
    /**
     * Submit weekly assessment
     */
    submitAssessment(userId: string, data: {
        weekRating: number;
        whatWentWell: string;
        challenges: string;
        nextWeekFocus: string;
        commitmentLevel: number;
    }): Promise<{
        id: any;
        weekStart: any;
        weekRating: any;
        commitmentLevel: any;
    }>;
    /**
     * Get assessment trends
     */
    getTrends(userId: string, weeks?: number): Promise<{
        weekRatings: {
            week: any;
            rating: any;
        }[];
        commitmentLevels: {
            week: any;
            level: any;
        }[];
    }>;
}
declare const _default: AssessmentService;
export default _default;
//# sourceMappingURL=assessmentService.d.ts.map