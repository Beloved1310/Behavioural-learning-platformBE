import { Document, Types } from 'mongoose';

export enum UserRole {
  STUDENT = 'STUDENT',
  TUTOR = 'TUTOR',
  PARENT = 'PARENT',
  ADMIN = 'ADMIN'
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM'
}

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM'
}

export enum BadgeType {
  STREAK = 'STREAK',
  COMPLETION = 'COMPLETION',
  ACHIEVEMENT = 'ACHIEVEMENT',
  MILESTONE = 'MILESTONE'
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  dateOfBirth?: Date;
  profileImage?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiry?: Date;
  subscriptionTier: SubscriptionTier;
  parentId?: Types.ObjectId;

  // Student specific fields
  academicGoals: string[];
  streakCount: number;
  totalPoints: number;
  lastLoginAt?: Date;

  // Tutor specific fields
  subjects: string[];
  hourlyRate?: number;
  bio?: string;
  qualifications: string[];
  rating: number;
  totalSessions: number;
  isBackgroundChecked: boolean;

  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ISession extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  tutorId: Types.ObjectId;
  subject: string;
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: SessionStatus;
  meetingUrl?: string;
  price: number;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
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
  requirement: number;
  points: number;
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
  timeLimit?: number; // in minutes
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
  completedAt: Date;
  timeSpent: number; // in seconds
  answers: any; // Store answers as object
}

export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionId?: Types.ObjectId;
  amount: number; // in pence
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
  sessionDuration: number; // in seconds
  actionsPerformed: number;
  mood?: 'happy' | 'neutral' | 'frustrated' | 'confused';
  engagementScore: number;
  pageViews?: any; // Store page view data
  timestamp: Date;
}

export interface IProgressReport extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalStudyTime: number; // in minutes
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