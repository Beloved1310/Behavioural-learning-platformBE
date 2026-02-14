/**
 * Type definitions for query objects used in controllers
 */
import { FilterQuery } from 'mongoose';
import { SessionStatus, SessionType } from './index';
/**
 * Query filter for sessions
 */
export interface SessionQueryFilter {
    studentId?: string | {
        $in: string[];
    };
    tutorId?: string;
    status?: SessionStatus;
    type?: SessionType;
    scheduledAt?: {
        $gte?: Date;
        $lte?: Date;
    };
}
/**
 * Query filter for tutor search
 */
export interface TutorSearchQuery {
    role?: string;
    isVerified?: boolean;
    isBackgroundChecked?: boolean;
    subjects?: {
        $in?: RegExp[];
        $regex?: RegExp;
        $size?: number;
        $exists?: boolean;
    } | null | RegExp;
    firstName?: {
        $regex: RegExp;
        $options: string;
    } | RegExp;
    lastName?: {
        $regex: RegExp;
        $options: string;
    } | RegExp;
    email?: {
        $regex: RegExp;
        $options: string;
    };
    bio?: RegExp;
    $or?: Array<{
        firstName?: {
            $regex: RegExp;
            $options: string;
        } | RegExp;
        lastName?: {
            $regex: RegExp;
            $options: string;
        } | RegExp;
        email?: {
            $regex: RegExp;
            $options: string;
        };
        subjects?: {
            $in?: RegExp[];
            $regex?: RegExp;
            $size?: number;
            $exists?: boolean;
        } | null | RegExp;
        bio?: RegExp;
        $expr?: Record<string, unknown>;
    }>;
    $and?: Array<Record<string, unknown>>;
    $expr?: Record<string, unknown>;
}
/**
 * Query filter for goals
 */
export interface GoalQueryFilter {
    userId?: string;
    status?: string;
    isActive?: boolean;
}
/**
 * Query filter for commitments
 */
export interface CommitmentQueryFilter {
    userId?: string;
    weekStart?: Date;
    weekEnd?: Date;
}
/**
 * Generic query filter with pagination
 */
export interface PaginatedQuery {
    page?: number;
    limit?: number;
    sort?: {
        [key: string]: 1 | -1;
    };
}
/**
 * MongoDB filter query type
 */
export type MongoFilterQuery<T> = FilterQuery<T>;
//# sourceMappingURL=queries.d.ts.map