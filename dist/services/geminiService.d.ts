export declare class GeminiService {
    private static genAI;
    private static reflectionModel;
    private static nudgeModel;
    /**
     * Extract JSON array from text, handling markdown code blocks and extra text
     */
    private static extractJsonFromText;
    private static initialize;
    /**
     * Generate reflection prompts for post-session reflection
     * @param sessionContext Optional context about the session (subject, duration, performance)
     */
    static generateReflectionPrompts(sessionContext?: {
        subject?: string;
        duration?: number;
        quizCompleted?: boolean;
        score?: number;
    }): Promise<string[]>;
    /**
     * Generate motivational nudges
     * @param userContext Optional context about the user (streak, recent activity)
     */
    static generateMotivationalNudges(userContext?: {
        currentStreak?: number;
        lastLoginDaysAgo?: number;
        quizzesCompletedThisWeek?: number;
    }): Promise<string[]>;
    /**
     * Default reflection prompts (fallback when AI is unavailable) - Growth mindset focused
     */
    private static getDefaultReflectionPrompts;
    /**
     * Default motivational nudges (fallback when AI is unavailable) - Growth mindset focused
     */
    private static getDefaultNudges;
    /**
     * Check if Gemini is configured and available
     */
    static isAvailable(): boolean;
}
export default GeminiService;
//# sourceMappingURL=geminiService.d.ts.map