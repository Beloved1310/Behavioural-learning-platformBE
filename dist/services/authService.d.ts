import { UserRole } from "../types";
export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    dateOfBirth?: string;
    parentEmail?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    static generateTokens(userId: string): {
        accessToken: string;
        refreshToken: string;
    };
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static register(data: RegisterData): Promise<{
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            isVerified: boolean;
            subscriptionTier: import("../types").SubscriptionTier;
            createdAt: Date;
        };
        message: string;
    }>;
    static login(data: LoginData): Promise<{
        user: {
            id: import("mongoose").Types.ObjectId;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            isVerified: true;
            subscriptionTier: import("../types").SubscriptionTier;
            profileImage: string | undefined;
            lastLoginAt: Date | undefined;
        };
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }>;
    static refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static verifyEmail(token: string): Promise<void>;
    static forgotPassword(email: string): Promise<{
        message: string;
    }>;
    static resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private static sendVerificationEmail;
    private static sendParentNotificationEmail;
    private static sendPasswordResetEmail;
}
//# sourceMappingURL=authService.d.ts.map