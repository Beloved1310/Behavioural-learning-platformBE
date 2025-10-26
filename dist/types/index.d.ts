import { Document, Types } from 'mongoose';
export declare enum UserRole {
    STUDENT = "STUDENT",
    TUTOR = "TUTOR",
    PARENT = "PARENT",
    ADMIN = "ADMIN"
}
export declare enum SubscriptionTier {
    BASIC = "BASIC",
    PREMIUM = "PREMIUM"
}
export declare enum SessionStatus {
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    MISSED = "missed"
}
export declare enum SessionType {
    STUDY = "study",
    TUTORING = "tutoring",
    QUIZ = "quiz",
    READING = "reading"
}
export declare enum RecurringPattern {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare enum PaymentStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
    REFUNDED = "refunded",
    CANCELLED = "cancelled"
}
export declare enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    PAST_DUE = "past_due",
    EXPIRED = "expired",
    TRIALING = "trialing"
}
export declare enum PaymentMethodType {
    CARD = "card",
    BANK_ACCOUNT = "bank_account",
    PAYPAL = "paypal"
}
export declare enum RefundStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    PROCESSED = "processed"
}
export declare enum MessageType {
    TEXT = "TEXT",
    FILE = "FILE",
    IMAGE = "IMAGE",
    SYSTEM = "SYSTEM"
}
export declare enum BadgeType {
    STREAK = "STREAK",
    COMPLETION = "COMPLETION",
    ACHIEVEMENT = "ACHIEVEMENT",
    MILESTONE = "MILESTONE"
}
export declare enum BadgeCategory {
    QUIZ = "quiz",
    STREAK = "streak",
    ACHIEVEMENT = "achievement",
    SPECIAL = "special"
}
export declare enum BadgeRarity {
    COMMON = "common",
    RARE = "rare",
    EPIC = "epic",
    LEGENDARY = "legendary"
}
export declare enum QuizDifficulty {
    EASY = "easy",
    MEDIUM = "medium",
    HARD = "hard"
}
export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    dateOfBirth?: Date;
    phoneNumber?: string;
    profileImage?: string;
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: Date;
    resetPasswordToken?: string;
    resetPasswordTokenExpiry?: Date;
    subscriptionTier: SubscriptionTier;
    subscriptionStatus?: SubscriptionStatus;
    parentId?: Types.ObjectId;
    stripeCustomerId?: string;
    gradeLevel?: string;
    learningStyle?: string;
    academicGoals: string[];
    streakCount: number;
    totalPoints: number;
    lastLoginAt?: Date;
    subjects: string[];
    hourlyRate?: number;
    bio?: string;
    qualifications: string[];
    rating: number;
    totalSessions: number;
    isBackgroundChecked: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    isMinor(): boolean;
}
export interface IUserPreferences extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    studyReminders: boolean;
    darkMode: boolean;
    language: string;
    timezone: string;
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    sessionReminders: boolean;
    progressReports: boolean;
    weeklyReport: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISession extends Document {
    _id: Types.ObjectId;
    studentId: Types.ObjectId;
    tutorId?: Types.ObjectId;
    subject: string;
    title: string;
    description?: string;
    type: SessionType;
    scheduledAt: Date;
    duration: number;
    status: SessionStatus;
    meetingUrl?: string;
    price: number;
    notes?: string;
    rating?: number;
    feedback?: string;
    isRecurring: boolean;
    recurringPattern?: RecurringPattern;
    reminderEnabled: boolean;
    reminderTime?: number;
    createdAt: Date;
    updatedAt: Date;
    canBeCancelled(): boolean;
}
export interface IChat extends Document {
    _id: Types.ObjectId;
    participants: Types.ObjectId[];
    title?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMessage extends Document {
    _id: Types.ObjectId;
    chatId: Types.ObjectId;
    senderId: Types.ObjectId;
    type: MessageType;
    content: string;
    fileUrl?: string;
    fileName?: string;
    isRead: boolean;
    createdAt: Date;
}
export interface IBadge extends Document {
    _id: Types.ObjectId;
    type: BadgeType;
    name: string;
    description: string;
    icon: string;
    category: BadgeCategory;
    rarity: BadgeRarity;
    criteria: {
        type: 'quiz_score' | 'quiz_count' | 'streak' | 'points' | 'perfect_score';
        threshold: number;
        subject?: string;
    };
    requirement: number;
    pointsReward: number;
    isActive: boolean;
    createdAt: Date;
}
export interface IUserBadge extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    badgeId: Types.ObjectId;
    earnedAt: Date;
}
export interface IQuiz extends Document {
    _id: Types.ObjectId;
    title: string;
    subject: string;
    description: string;
    difficulty: QuizDifficulty;
    timeLimit?: number;
    passingScore: number;
    points: number;
    isActive: boolean;
    questions: IQuestion[];
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuestion {
    _id: Types.ObjectId;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    question: string;
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    points: number;
    order: number;
}
export interface IQuizAttempt extends Document {
    _id: Types.ObjectId;
    quizId: Types.ObjectId;
    studentId: Types.ObjectId;
    score: number;
    totalPoints: number;
    percentage: number;
    completedAt: Date;
    timeSpent: number;
    answers: any;
}
export interface IPayment extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    sessionId?: Types.ObjectId;
    amount: number;
    currency: string;
    status: PaymentStatus;
    stripePaymentIntentId?: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IBehavioralData extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    sessionDuration: number;
    actionsPerformed: number;
    mood?: 'happy' | 'neutral' | 'frustrated' | 'confused';
    engagementScore: number;
    pageViews?: any;
    timestamp: Date;
}
export interface IProgressReport extends Document {
    _id: Types.ObjectId;
    studentId: Types.ObjectId;
    period: 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
    totalStudyTime: number;
    sessionsCompleted: number;
    quizzesTaken: number;
    averageScore: number;
    streakDays: number;
    badgesEarned: number;
    pointsEarned: number;
    insights: string[];
    recommendations: string[];
    generatedAt: Date;
}
export interface INotification extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: string;
    title: string;
    message: string;
    data?: any;
    isRead: boolean;
    createdAt: Date;
}
export interface IStudyReminder extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    title: string;
    description?: string;
    scheduledAt: Date;
    isRecurring: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    isActive: boolean;
    createdAt: Date;
    deactivate(): Promise<IStudyReminder>;
    getNextOccurrence(): Date | null;
}
export interface IFile extends Document {
    _id: Types.ObjectId;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedBy: Types.ObjectId;
    createdAt: Date;
}
export interface IUserProgress extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    subject: string;
    level: number;
    currentXP: number;
    nextLevelXP: number;
    completedQuizzes: number;
    averageScore: number;
    studyTime: number;
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IMoodLog extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    mood: 'happy' | 'sad' | 'angry' | 'anxious' | 'excited' | 'calm' | 'frustrated' | 'confused' | 'confident' | 'neutral';
    intensity: number;
    context?: string;
    tags: string[];
    notes?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICustomEvent extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    eventType: string;
    eventData: any;
    page?: string;
    sessionId?: string;
    timestamp: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IRecommendation extends Document {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    type: 'content' | 'study_time' | 'break' | 'technique' | 'goal';
    title: string;
    description: string;
    priority: number;
    metadata: any;
    isRead: boolean;
    isActioned: boolean;
    expiresAt?: Date;
    generatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    markAsRead(): Promise<IRecommendation>;
    markAsActioned(): Promise<IRecommendation>;
}
//# sourceMappingURL=index.d.ts.map