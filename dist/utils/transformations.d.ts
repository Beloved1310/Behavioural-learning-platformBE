/**
 * Common transformation utilities for converting database models to API responses
 * Reduces code duplication across controllers
 */
import { Types } from 'mongoose';
/**
 * Transform session document to API response format
 */
export interface SessionResponse {
    id: string;
    studentId?: string;
    tutorId?: string;
    userId?: string;
    tutor?: {
        id: string;
        name: string;
        avatar: string | null;
        email?: string;
    };
    student?: {
        id: string;
        name: string;
        avatar?: string | null;
        email?: string;
    };
    title: string;
    subject: string;
    type: string;
    startTime: string;
    endTime?: string;
    duration: number;
    status: string;
    price?: number;
    description?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    reminderEnabled?: boolean;
    reminderTime?: number;
    meetingUrl?: string;
    notes?: string;
    rating?: number;
    feedback?: string;
    createdAt?: string;
    updatedAt?: string;
}
export declare function transformSession(session: {
    _id: {
        toString(): string;
    };
    studentId: unknown;
    tutorId?: unknown;
    title: string;
    subject: string;
    type: string;
    scheduledAt: Date;
    duration: number;
    status: string;
    price?: number;
    description?: string;
    isRecurring?: boolean;
    recurringPattern?: string;
    reminderEnabled?: boolean;
    reminderTime?: number;
    meetingUrl?: string;
    notes?: string;
    rating?: number;
    feedback?: string;
    createdAt?: Date;
    updatedAt?: Date;
}): SessionResponse;
/**
 * Transform tutor document to API response format
 */
export interface TutorResponse {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    avatar: string | null;
    subjects: string[];
    hourlyRate: number;
    rating: number;
    totalSessions: number;
    bio: string;
}
export declare function transformTutor(tutor: {
    _id: {
        toString(): string;
    };
    firstName: string;
    lastName: string;
    profileImage?: string;
    subjects?: string[];
    hourlyRate?: number;
    rating?: number;
    totalSessions?: number;
    bio?: string;
}): TutorResponse;
/**
 * Transform goal document to API response format
 */
export declare function transformGoal(goal: any): any;
/**
 * Transform user document to API response format
 */
export declare function transformUser(user: any): any;
/**
 * Safely convert MongoDB ObjectId to string
 */
export declare function toObjectIdString(id: string | Types.ObjectId | undefined): string | undefined;
//# sourceMappingURL=transformations.d.ts.map