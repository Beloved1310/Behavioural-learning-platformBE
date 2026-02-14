/**
 * Parent Email Scheduler Service
 * Sends automated weekly progress reports to parents
 */
declare class ParentEmailScheduler {
    private isRunning;
    /**
     * Start the weekly email scheduler
     * Runs every Monday at 9:00 AM
     */
    start(): void;
    /**
     * Send weekly progress reports to all parents
     */
    sendWeeklyReports(): Promise<void>;
    /**
     * Manually trigger weekly reports (for testing)
     */
    triggerWeeklyReports(): Promise<void>;
}
export declare const parentEmailScheduler: ParentEmailScheduler;
export default parentEmailScheduler;
//# sourceMappingURL=parentEmailScheduler.d.ts.map