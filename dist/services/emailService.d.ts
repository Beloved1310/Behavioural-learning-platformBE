interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}
declare class EmailService {
    private transporter;
    constructor();
    sendEmail(options: EmailOptions): Promise<void>;
    sendWelcomeEmail(email: string, firstName: string): Promise<void>;
    sendSessionReminderEmail(email: string, firstName: string, sessionTitle: string, scheduledAt: Date): Promise<void>;
    sendProgressReportEmail(email: string, firstName: string, reportData: {
        period: string;
        studyTime: number;
        sessionsCompleted: number;
        averageScore: number;
        streak: number;
    }): Promise<void>;
    sendParentProgressReportEmail(email: string, firstName: string, reportData: {
        period: string;
        children: Array<{
            name: string;
            studyHours: number;
            quizzesCompleted: number;
            averageScore: number;
            progress: number;
            strongestSubject: string;
            weakestSubject: string;
        }>;
        familyTotalStudyHours: number;
        familyAverageProgress: number;
    }): Promise<void>;
    sendParentStudyHabitsEmail(email: string, firstName: string, reportData: {
        period: string;
        children: Array<{
            name: string;
            averageStudyTime: number;
            studyStreak: number;
            preferredStudyTime: string;
            mostActiveDay: string;
            consistencyScore: number;
        }>;
    }): Promise<void>;
    sendParentBehavioralInsightsEmail(email: string, firstName: string, reportData: {
        period: string;
        children: Array<{
            name: string;
            engagementLevel: string;
            motivationTrend: string;
            focusAreas: string[];
            achievements: string[];
            recommendations: string[];
        }>;
    }): Promise<void>;
    /**
     * Send weekly progress email to parent (MVP - Simplified)
     */
    sendParentWeeklyProgressEmail(email: string, firstName: string, reportData: {
        weekStart: string;
        weekEnd: string;
        children: Array<{
            name: string;
            streak: number;
            goalProgress: number;
            commitmentsCompleted: number;
            commitmentsTotal: number;
            consistencyScore: number;
            status: 'on-track' | 'needs-attention' | 'at-risk';
            lastLoginAt?: Date | string;
        }>;
    }): Promise<void>;
}
declare const emailService: EmailService;
export declare const sendEmail: (options: EmailOptions) => Promise<void>;
export declare const sendWelcomeEmail: (email: string, firstName: string) => Promise<void>;
export declare const sendSessionReminderEmail: (email: string, firstName: string, sessionTitle: string, scheduledAt: Date) => Promise<void>;
export declare const sendProgressReportEmail: (email: string, firstName: string, reportData: {
    period: string;
    studyTime: number;
    sessionsCompleted: number;
    averageScore: number;
    streak: number;
}) => Promise<void>;
export declare const sendParentProgressReportEmail: (email: string, firstName: string, reportData: {
    period: string;
    children: Array<{
        name: string;
        studyHours: number;
        quizzesCompleted: number;
        averageScore: number;
        progress: number;
        strongestSubject: string;
        weakestSubject: string;
    }>;
    familyTotalStudyHours: number;
    familyAverageProgress: number;
}) => Promise<void>;
export declare const sendParentStudyHabitsEmail: (email: string, firstName: string, reportData: {
    period: string;
    children: Array<{
        name: string;
        averageStudyTime: number;
        studyStreak: number;
        preferredStudyTime: string;
        mostActiveDay: string;
        consistencyScore: number;
    }>;
}) => Promise<void>;
export declare const sendParentBehavioralInsightsEmail: (email: string, firstName: string, reportData: {
    period: string;
    children: Array<{
        name: string;
        engagementLevel: string;
        motivationTrend: string;
        focusAreas: string[];
        achievements: string[];
        recommendations: string[];
    }>;
}) => Promise<void>;
export declare const sendParentWeeklyProgressEmail: (email: string, firstName: string, reportData: {
    weekStart: string;
    weekEnd: string;
    children: Array<{
        name: string;
        streak: number;
        goalProgress: number;
        commitmentsCompleted: number;
        commitmentsTotal: number;
        consistencyScore: number;
        status: "on-track" | "needs-attention" | "at-risk";
        lastLoginAt?: Date | string;
    }>;
}) => Promise<void>;
export default emailService;
//# sourceMappingURL=emailService.d.ts.map