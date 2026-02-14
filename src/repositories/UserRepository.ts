import { FilterQuery } from 'mongoose';
import { User } from '../models/User';
import { IUser, UserRole } from '../types';
import { BaseRepository } from './BaseRepository';
import { logger } from '../utils/logger';

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
    // Normalize email: lowercase and trim
    const normalizedEmail = email.toLowerCase().trim();

    // Find user with password field explicitly selected
    const user = await this.model.findOne({ email: normalizedEmail }).select('+password');

    // Enhanced debugging in development
    if (process.env.NODE_ENV === 'development' && !user) {
      // Check if user exists without password field
      const userWithoutPassword = await this.model.findOne({ email: normalizedEmail });
      if (userWithoutPassword) {
        logger.error('User exists but password field not retrieved', undefined, {
          email: normalizedEmail,
          userId: userWithoutPassword._id.toString(),
          isVerified: userWithoutPassword.isVerified,
        });
      }
    }

    return user;
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
   * Find user by verification token (including expired tokens)
   */
  async findByVerificationToken(
    token: string,
    includeExpired: boolean = false
  ): Promise<IUser | null> {
    if (!token) {
      return null;
    }

    // Trim and normalize the token to handle any whitespace issues
    const normalizedToken = token.trim();

    // Build query - use exact match for token (hex strings are case-insensitive, but we'll match exactly)
    const query: any = {
      verificationToken: normalizedToken,
    };

    if (!includeExpired) {
      query.verificationTokenExpiry = { $gt: new Date() };
    }

    try {
      // First, try to find using lean() to bypass any select issues, then fetch full document
      const leanUser = await this.model
        .findOne({
          verificationToken: normalizedToken,
        })
        .lean();

      if (leanUser) {
        // If found with lean, fetch the full document with field selection
        const user = await this.model
          .findById(leanUser._id)
          .select('+verificationToken +verificationTokenExpiry');

        if (user) {
          // Double-check token matches (case-sensitive comparison)
          const userToken = (user as any).verificationToken;
          if (userToken === normalizedToken) {
            return user;
          } else if (process.env.NODE_ENV === 'development') {
            logger.warn('Token mismatch after fetch', {
              expected: normalizedToken.substring(0, 20) + '...',
              actual: userToken ? userToken.substring(0, 20) + '...' : 'null',
            });
          }
        }
      }

      // Fallback: Try direct query with field selection
      const user = await this.model
        .findOne(query)
        .select('+verificationToken +verificationTokenExpiry');

      if (user) {
        const userToken = (user as any).verificationToken;
        if (userToken === normalizedToken) {
          return user;
        }
      }

      // Enhanced debugging in development
      if (process.env.NODE_ENV === 'development') {
        // Try querying without field selection to see if token exists
        const debugUser = await this.model
          .findOne({
            verificationToken: normalizedToken,
          })
          .lean();

        if (debugUser) {
          logger.error('User found but field selection failed. Token exists', undefined, {
            userId: debugUser._id.toString(),
            email: debugUser.email,
            isVerified: debugUser.isVerified,
            hasToken: !!debugUser.verificationToken,
            tokenInDB: (debugUser as any).verificationToken
              ? (debugUser as any).verificationToken.substring(0, 20) + '...'
              : 'null',
          });

          // Try to get the user with explicit field selection using findById
          const userById = await this.model
            .findById(debugUser._id)
            .select('+verificationToken +verificationTokenExpiry');
          if (userById && (userById as any).verificationToken) {
            logger.debug('Successfully retrieved token via findById', {
              tokenMatch: (userById as any).verificationToken === normalizedToken,
              dbToken: (userById as any).verificationToken.substring(0, 20) + '...',
              queryToken: normalizedToken.substring(0, 20) + '...',
            });
            return userById;
          }
        } else {
          // Check if any users have verification tokens (for debugging)
          const anyUserWithToken = await this.model
            .findOne({
              verificationToken: { $exists: true, $ne: null },
            })
            .select('+verificationToken email isVerified')
            .lean();

          if (anyUserWithToken) {
            const dbToken = (anyUserWithToken as any).verificationToken;
            logger.debug('Users with verification tokens exist, but token mismatch', {
              dbTokenPreview: dbToken ? dbToken.substring(0, 20) + '...' : 'null',
              queryTokenPreview: normalizedToken.substring(0, 20) + '...',
              tokensMatch: dbToken === normalizedToken,
              dbTokenLength: dbToken ? dbToken.length : 0,
              queryTokenLength: normalizedToken.length,
            });
          } else {
            // Check if there are any unverified users at all
            const unverifiedUsers = await this.model.countDocuments({ isVerified: false });
            logger.debug('No users found with verification tokens', {
              unverifiedUsersCount: unverifiedUsers,
            });

            // Try to find the most recent unverified user to see what fields they have
            const recentUser = await this.model
              .findOne({ isVerified: false })
              .sort({ createdAt: -1 })
              .select('email createdAt')
              .lean();

            if (recentUser) {
              logger.debug('Most recent unverified user', {
                email: recentUser.email,
                createdAt: recentUser.createdAt,
              });
            }
          }
        }
      }

      return null;
    } catch (error) {
      logger.error('Error finding user by verification token', error);
      return null;
    }
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
