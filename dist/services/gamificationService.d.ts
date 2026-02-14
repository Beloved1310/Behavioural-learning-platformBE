export declare class GamificationService {
    /**
     * Normalize subject name from alias to canonical form
     * e.g., "Math" -> "Mathematics", "CS" -> "Computer Science"
     */
    private static normalizeSubject;
    static createQuiz(data: {
        title: string;
        subject: string;
        description: string;
        difficulty: string;
        timeLimit?: number;
        passingScore: number;
        points: number;
        isActive?: boolean;
        questions: Array<{
            type: string;
            question: string;
            options: string[];
            correctAnswer: string;
            explanation?: string;
            points: number;
            order: number;
        }>;
    }): Promise<{
        id: any;
        title: any;
        subject: any;
        difficulty: any;
        description: any;
        timeLimit: any;
        questionCount: any;
        totalPoints: any;
        passingScore: any;
        isActive: any;
        createdAt: any;
    }>;
    static getQuizzes(filters: {
        subject?: string;
        difficulty?: string;
        page?: number;
        limit?: number;
        skip?: number;
    }): Promise<{
        quizzes: any;
        total: any;
    }>;
    static getQuizById(id: string): Promise<{
        id: any;
        title: any;
        subject: any;
        difficulty: any;
        description: any;
        timeLimit: any;
        passingScore: any;
        questions: any;
    }>;
    static submitQuizAttempt(userId: string, payload: {
        quizId: string;
        answers: Record<string, string>;
        timeSpent: number;
    }): Promise<{
        attempt: import("../types").IQuizAttempt;
        newBadges: any[];
        pointsEarned: number;
    }>;
    static getRecentAttempts(userId: string, limit: number, skip?: number): Promise<{
        attempts: {
            id: any;
            quizId: any;
            score: number;
            totalPoints: number;
            percentage: number;
            completedAt: any;
            timeSpent: number;
        }[];
        total: any;
    }>;
    static getChildrenQuizAttempts(parentId: string, studentId?: string, page?: number, limit?: number, skip?: number): Promise<{
        attempts: {
            id: any;
            quizId: any;
            quizTitle: any;
            subject: any;
            studentId: any;
            studentName: string;
            score: any;
            totalPoints: any;
            percentage: any;
            completedAt: any;
            timeSpent: any;
        }[];
        total: any;
    }>;
    static getUserProfile(userId: string): Promise<{
        userId: string;
        level: number;
        currentXP: number;
        nextLevelXP: number;
        totalPoints: any;
        streak: {
            currentStreak: any;
            longestStreak: any;
            isActive: boolean;
        };
        badges: {
            id: any;
            userId: any;
            badgeId: any;
            badge: {
                id: any;
                name: any;
                description: any;
                icon: any;
                category: any;
                rarity: any;
                criteria: any;
                pointsReward: any;
                createdAt: any;
                isActive: any;
            };
            earnedAt: any;
        }[];
        rank: any;
    }>;
    static getUserProgress(userId: string): Promise<{
        id: any;
        userId: any;
        subject: any;
        level: any;
        currentXP: any;
        nextLevelXP: any;
        completedQuizzes: any;
        averageScore: any;
        studyTime: any;
        lastActivity: any;
    }[]>;
    static getAvailableBadges(): Promise<{
        id: any;
        name: any;
        description: any;
        icon: any;
        category: any;
        rarity: any;
        criteria: any;
        pointsReward: any;
        createdAt: any;
        isActive: any;
    }[]>;
    static getLeaderboard(userId: string | undefined, limit: number, timeframe?: 'week' | 'month' | 'all'): Promise<any[]>;
    static checkBadgeEligibility(userId: string, quizPercentage: number, subject: string): Promise<any[]>;
}
export default GamificationService;
//# sourceMappingURL=gamificationService.d.ts.map