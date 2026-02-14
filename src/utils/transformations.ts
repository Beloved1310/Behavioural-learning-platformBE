/**
 * Common transformation utilities for converting database models to API responses
 * Reduces code duplication across controllers
 */

import { Document, Types } from 'mongoose';

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

export function transformSession(session: {
  _id: { toString(): string };
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
}): SessionResponse {
  return {
    id: session._id.toString(),
    studentId: session.studentId ? (typeof session.studentId === 'string' ? session.studentId : (session.studentId as any)._id?.toString() || (session.studentId as any).toString() || String(session.studentId)) : undefined,
    tutorId: session.tutorId ? (typeof session.tutorId === 'string' ? session.tutorId : (session.tutorId as any)._id?.toString() || (session.tutorId as any).toString() || String(session.tutorId)) : undefined,
    tutor: session.tutorId && typeof session.tutorId === 'object' && 'firstName' in session.tutorId
      ? {
          id: (session.tutorId as any)._id?.toString() || (session.tutorId as any).id,
          name: `${(session.tutorId as any).firstName || ''} ${(session.tutorId as any).lastName || ''}`.trim(),
          avatar: (session.tutorId as any).profileImage || null,
        }
      : undefined,
    student: session.studentId && typeof session.studentId === 'object' && 'firstName' in session.studentId
      ? {
          id: (session.studentId as any)._id?.toString() || (session.studentId as any).id,
          name: `${(session.studentId as any).firstName || ''} ${(session.studentId as any).lastName || ''}`.trim(),
        }
      : undefined,
    title: session.title,
    subject: session.subject,
    type: session.type,
    startTime: session.scheduledAt?.toISOString(),
    endTime: session.scheduledAt && session.duration
      ? new Date(session.scheduledAt.getTime() + session.duration * 60000).toISOString()
      : undefined,
    duration: session.duration,
    status: session.status,
    price: session.price,
    description: session.description,
    isRecurring: session.isRecurring,
    recurringPattern: session.recurringPattern,
    reminderEnabled: session.reminderEnabled,
    reminderTime: session.reminderTime,
    meetingUrl: session.meetingUrl,
    notes: session.notes,
    rating: session.rating,
    createdAt: session.createdAt?.toISOString(),
    updatedAt: session.updatedAt?.toISOString(),
  };
}

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

export function transformTutor(tutor: {
  _id: { toString(): string };
  firstName: string;
  lastName: string;
  profileImage?: string;
  subjects?: string[];
  hourlyRate?: number;
  rating?: number;
  totalSessions?: number;
  bio?: string;
}): TutorResponse {
  return {
    id: tutor._id.toString(),
    firstName: tutor.firstName,
    lastName: tutor.lastName,
    name: `${tutor.firstName} ${tutor.lastName}`,
    avatar: tutor.profileImage || null,
    subjects: tutor.subjects || [],
    hourlyRate: tutor.hourlyRate || 25,
    rating: tutor.rating || 0,
    totalSessions: tutor.totalSessions || 0,
    bio: tutor.bio || '',
  };
}

/**
 * Transform goal document to API response format
 */
export function transformGoal(goal: any): any {
  return {
    id: goal._id.toString(),
    title: goal.title,
    description: goal.description,
    target: goal.target,
    current: goal.current,
    deadline: goal.deadline?.toISOString(),
    milestones: goal.milestones || [],
    achievedMilestones: goal.achievedMilestones || [],
    assignedBy: goal.assignedBy?.toString() || null,
    assignedAt: goal.assignedAt?.toISOString(),
    status: goal.status || 'active',
    tutorFeedback: goal.tutorFeedback,
    isActive: goal.isActive,
    createdAt: goal.createdAt?.toISOString(),
    updatedAt: goal.updatedAt?.toISOString(),
  };
}

/**
 * Transform user document to API response format
 */
export function transformUser(user: any): any {
  return {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    profileImage: user.profileImage || null,
    isVerified: user.isVerified,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

/**
 * Safely convert MongoDB ObjectId to string
 */
export function toObjectIdString(id: string | Types.ObjectId | undefined): string | undefined {
  if (!id) return undefined;
  if (typeof id === 'string') return id;
  if (id instanceof Types.ObjectId) return id.toString();
  return String(id);
}

