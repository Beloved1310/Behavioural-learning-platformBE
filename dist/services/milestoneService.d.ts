export declare class MilestoneService {
    /**
     * Get upcoming milestones for a user
     */
    getUpcoming(userId: string): Promise<{
        type: string;
        goalId: any;
        goalTitle: any;
        current: any;
        target: number;
        milestonePercent: any;
    } | {
        type: string;
        current: any;
        target: number;
    } | null>;
    /**
     * Check and award milestones
     */
    checkMilestones(userId: string): Promise<{
        newMilestones: any[];
        hasNewMilestones: boolean;
    }>;
}
declare const _default: MilestoneService;
export default _default;
//# sourceMappingURL=milestoneService.d.ts.map