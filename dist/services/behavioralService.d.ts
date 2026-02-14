export declare class BehavioralService {
    /**
     * Track engagement event (login, session start, etc.)
     */
    static trackEngagement(userId: string, data: {
        eventType: 'login' | 'session_start' | 'session_end' | 'quiz_start' | 'quiz_complete';
        sessionId?: string;
        duration?: number;
        metadata?: Record<string, any>;
    }): Promise<import("../types").ICustomEvent>;
    /**
     * Record behavioral data (session duration, engagement score)
     */
    static recordBehavioralData(userId: string, data: {
        sessionDuration: number;
        actionsPerformed: number;
        mood?: 'happy' | 'neutral' | 'frustrated' | 'confused';
        engagementScore: number;
        pageViews?: any;
    }): Promise<import("../types").IBehavioralData>;
    /**
     * Get weekly progress summary (quiz completion, session participation)
     */
    static getWeeklyProgressSummary(userId: string): Promise<{
        weekStart: Date;
        weekEnd: Date;
        sessions: {
            completed: number;
            totalDuration: any;
        };
        quizzes: {
            completed: number;
            averageScore: number;
        };
        engagement: {
            totalTime: number;
            averageScore: number;
        };
    }>;
    /**
     * Get motivational nudges (AI-generated or template-based)
     */
    static getMotivationalNudges(userId: string, maxNudges?: number): Promise<string[]>;
    /**
     * Template-based nudges (fallback when AI unavailable)
     * Enhanced with more variety for Behavior Nudges feature
     */
    private static getTemplateNudges;
    /**
     * Get reflection prompts for post-session (AI-generated or template-based)
     */
    static getReflectionPrompts(sessionContext?: {
        subject?: string;
        duration?: number;
        quizCompleted?: boolean;
        score?: number;
    }): Promise<string[]>;
    /**
     * Template-based reflection prompts (fallback when AI unavailable)
     */
    private static getTemplateReflectionPrompts;
    static trackEvent(userId: string, data: {
        eventType: string;
        eventData?: any;
        page?: string;
        sessionId?: string;
    }): Promise<import("../types").ICustomEvent>;
    static getEventHistory(userId: string, eventType: string | undefined, limit: number): Promise<import("../types").ICustomEvent[]>;
    static getEventCounts(userId: string, days: number): Promise<any>;
    static getPageViews(userId: string, days: number): Promise<any>;
    static getBehavioralInsights(userId: string, days: number): Promise<{
        type: string;
        title: string;
        description: string;
    }[]>;
    static getStudyConsistency(userId: string, days: number): Promise<{
        dailyPattern: never[];
        weeklyPattern: never[];
        currentStreak: number;
        lastActive: Date;
    }>;
    static getRecommendations(userId: string, type: string | undefined, limit: number): Promise<never[]>;
    static generateRecommendations(userId: string): Promise<never[]>;
    static markRecommendationAsRead(id: string, userId: string): Promise<void>;
    static markRecommendationAsActioned(id: string, userId: string): Promise<void>;
    static getProgressReports(userId: string, period: 'weekly' | 'monthly' | undefined, limit: number): Promise<never[]>;
    static generateProgressReport(userId: string, period: 'weekly' | 'monthly'): Promise<void>;
    static getSentimentAnalysis(userId: string, days: number): Promise<{
        overall: string;
        moodScore: number;
        engagementScore: number;
        dataPoints: {
            engagementRecords: number;
        };
        source: "rule-based";
    }>;
}
export default BehavioralService;
//# sourceMappingURL=behavioralService.d.ts.map