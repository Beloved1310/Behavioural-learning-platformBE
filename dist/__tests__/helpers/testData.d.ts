import { UserRole } from '../../types';
export declare const validUserData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    dateOfBirth: string;
    parentEmail: string;
};
export declare const validTutorData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
};
export declare const validParentData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
};
export declare const invalidUserData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: any;
};
export declare const createMockUser: (overrides?: {}) => {
    _id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isVerified: boolean;
    subscriptionTier: string;
    academicGoals: never[];
    streakCount: number;
    totalPoints: number;
    subjects: never[];
    qualifications: never[];
    rating: number;
    totalSessions: number;
    isBackgroundChecked: boolean;
    createdAt: Date;
    updatedAt: Date;
};
export declare const generateValidToken: () => string;
export declare const generateExpiredDate: () => Date;
export declare const generateFutureDate: () => Date;
//# sourceMappingURL=testData.d.ts.map