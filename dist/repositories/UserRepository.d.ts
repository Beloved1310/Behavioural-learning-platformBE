import { FilterQuery } from 'mongoose';
import { IUser, UserRole } from '../types';
import { BaseRepository } from './BaseRepository';
/**
 * User Repository
 * Handles database operations for users
 */
declare class UserRepository extends BaseRepository<IUser> {
    constructor();
    /**
     * Find user by email
     */
    findByEmail(email: string): Promise<IUser | null>;
    /**
     * Find user by email with password (for authentication)
     */
    findByEmailWithPassword(email: string): Promise<IUser | null>;
    /**
     * Find user by ID with selected fields
     */
    findByIdWithFields(id: string, fields: string): Promise<IUser | null>;
    /**
     * Update user's last login timestamp
     */
    updateLastLogin(userId: string): Promise<IUser | null>;
    /**
     * Find users by role
     */
    findByRole(role: UserRole, additionalFilters?: FilterQuery<IUser>): Promise<IUser[]>;
    /**
     * Check if email exists
     */
    emailExists(email: string): Promise<boolean>;
    /**
     * Find user by verification token
     */
    findByVerificationToken(token: string): Promise<IUser | null>;
    /**
     * Verify user and clear verification token
     */
    verifyUserEmail(userId: string): Promise<IUser | null>;
    /**
     * Update verification token
     */
    updateVerificationToken(userId: string, token: string, expiry: Date): Promise<IUser | null>;
    /**
     * Find user by reset password token
     */
    findByResetPasswordToken(token: string): Promise<IUser | null>;
    /**
     * Update reset password token
     */
    updateResetPasswordToken(userId: string, token: string, expiry: Date): Promise<IUser | null>;
    /**
     * Reset password and clear reset token
     */
    resetPassword(userId: string, hashedPassword: string): Promise<IUser | null>;
}
export declare const userRepository: UserRepository;
export default userRepository;
//# sourceMappingURL=UserRepository.d.ts.map