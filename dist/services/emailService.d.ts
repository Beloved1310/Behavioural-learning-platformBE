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
export default emailService;
//# sourceMappingURL=emailService.d.ts.map