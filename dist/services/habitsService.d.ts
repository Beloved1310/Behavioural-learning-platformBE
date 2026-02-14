export declare class HabitsService {
    /**
     * Get habit heatmap data
     */
    getHeatmap(userId: string, days?: number): Promise<{
        date: string;
        activity: number;
        count: number;
    }[]>;
    /**
     * Get all active streaks
     */
    getStreaks(userId: string): Promise<{
        type: string;
        name: string;
        days: any;
        icon: string;
    }[]>;
    /**
     * Calculate streak for a specific event type
     */
    private calculateStreak;
}
declare const _default: HabitsService;
export default _default;
//# sourceMappingURL=habitsService.d.ts.map