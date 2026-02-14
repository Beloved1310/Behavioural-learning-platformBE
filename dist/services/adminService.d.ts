import { UserRole } from '../types';
export declare class AdminService {
    static getPendingTutors(page?: number, limit?: number): Promise<{
        tutors: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getTutorById(tutorId: string): Promise<{
        id: any;
        firstName: any;
        lastName: any;
        email: any;
        profileImage: any;
        subjects: any;
        qualifications: any;
        bio: any;
        hourlyRate: any;
        rating: any;
        totalSessions: any;
        isVerified: any;
        isBackgroundChecked: any;
        createdAt: any;
        updatedAt: any;
    }>;
    static approveTutor(tutorId: string, adminNotes?: string): Promise<{
        id: any;
        firstName: any;
        lastName: any;
        email: any;
        isVerified: any;
        isBackgroundChecked: any;
    }>;
    static rejectTutor(tutorId: string, reason: string): Promise<{
        id: any;
        message: string;
    }>;
    static setBackgroundCheckStatus(tutorId: string, isBackgroundChecked: boolean): Promise<{
        id: any;
        isBackgroundChecked: any;
    }>;
    static getAllUsers(filters: {
        role?: UserRole;
        search?: string;
        isVerified?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{
        users: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    static getUserById(userId: string): Promise<any>;
    static updateUserStatus(userId: string, isActive: boolean): Promise<{
        id: any;
        isVerified: any;
        message: string;
    }>;
    static getDashboardStats(): Promise<{
        totalUsers: any;
        totalStudents: any;
        totalTutors: any;
        totalParents: any;
        pendingTutors: any;
        verifiedTutors: any;
        activeUsers: any;
    }>;
}
//# sourceMappingURL=adminService.d.ts.map