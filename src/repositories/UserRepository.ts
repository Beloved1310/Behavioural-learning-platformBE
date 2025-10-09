import { FilterQuery } from 'mongoose';
import { User } from '../models/User';
import { IUser, UserRole } from '../types';
import { BaseRepository } from './BaseRepository';

/**
 * User Repository
 * Handles database operations for users
 */
class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return await this.findOne({ email: email.toLowerCase() } as FilterQuery<IUser>);
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return await this.model.findOne({ email: email.toLowerCase() }).select('+password');
  }

  /**
   * Find user by ID with selected fields
   */
  async findByIdWithFields(id: string, fields: string): Promise<IUser | null> {
    return await this.model.findById(id).select(fields);
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<IUser | null> {
    return await this.updateById(userId, { lastLoginAt: new Date() } as any);
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, additionalFilters?: FilterQuery<IUser>): Promise<IUser[]> {
    const query: FilterQuery<IUser> = { role, ...additionalFilters };
    return await this.find(query);
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    return await this.exists({ email: email.toLowerCase() } as FilterQuery<IUser>);
  }

  /**
   * Find user by verification token
   */
  async findByVerificationToken(token: string): Promise<IUser | null> {
    return await this.model
      .findOne({
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() },
      })
      .select('+verificationToken +verificationTokenExpiry');
  }

  /**
   * Verify user and clear verification token
   */
  async verifyUserEmail(userId: string): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      {
        isVerified: true,
        $unset: { verificationToken: '', verificationTokenExpiry: '' },
      },
      { new: true }
    );
  }

  /**
   * Update verification token
   */
  async updateVerificationToken(
    userId: string,
    token: string,
    expiry: Date
  ): Promise<IUser | null> {
    return await this.updateById(userId, {
      verificationToken: token,
      verificationTokenExpiry: expiry,
    } as any);
  }

  /**
   * Find user by reset password token
   */
  async findByResetPasswordToken(token: string): Promise<IUser | null> {
    return await this.model
      .findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpiry: { $gt: new Date() },
      })
      .select('+resetPasswordToken +resetPasswordTokenExpiry');
  }

  /**
   * Update reset password token
   */
  async updateResetPasswordToken(
    userId: string,
    token: string,
    expiry: Date
  ): Promise<IUser | null> {
    return await this.updateById(userId, {
      resetPasswordToken: token,
      resetPasswordTokenExpiry: expiry,
    } as any);
  }

  /**
   * Reset password and clear reset token
   */
  async resetPassword(userId: string, hashedPassword: string): Promise<IUser | null> {
    return await this.model.findByIdAndUpdate(
      userId,
      {
        password: hashedPassword,
        $unset: { resetPasswordToken: '', resetPasswordTokenExpiry: '' },
      },
      { new: true }
    );
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
export default userRepository;
