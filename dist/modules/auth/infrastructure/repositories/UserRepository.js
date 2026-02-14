"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const User_1 = require("../models/User");
const BaseRepository_1 = require("./BaseRepository");
/**
 * User Repository
 * Handles database operations for users
 */
class UserRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(User_1.User);
    }
    /**
     * Find user by email
     */
    async findByEmail(email) {
        return await this.findOne({ email: email.toLowerCase() });
    }
    /**
     * Find user by email with password (for authentication)
     */
    async findByEmailWithPassword(email) {
        // Normalize email: lowercase and trim
        const normalizedEmail = email.toLowerCase().trim();
        // Find user with password field explicitly selected
        const user = await this.model
            .findOne({ email: normalizedEmail })
            .select('+password');
        // Enhanced debugging in development
        if (process.env.NODE_ENV === 'development' && !user) {
            // Check if user exists without password field
            const userWithoutPassword = await this.model.findOne({ email: normalizedEmail });
            if (userWithoutPassword) {
                console.error('[UserRepository] User exists but password field not retrieved:', {
                    email: normalizedEmail,
                    userId: userWithoutPassword._id,
                    isVerified: userWithoutPassword.isVerified
                });
            }
        }
        return user;
    }
    /**
     * Find user by ID with selected fields
     */
    async findByIdWithFields(id, fields) {
        return await this.model.findById(id).select(fields);
    }
    /**
     * Update user's last login timestamp
     */
    async updateLastLogin(userId) {
        return await this.updateById(userId, { lastLoginAt: new Date() });
    }
    /**
     * Find users by role
     */
    async findByRole(role, additionalFilters) {
        const query = { role, ...additionalFilters };
        return await this.find(query);
    }
    /**
     * Check if email exists
     */
    async emailExists(email) {
        return await this.exists({ email: email.toLowerCase() });
    }
    /**
     * Find user by verification token (including expired tokens)
     */
    async findByVerificationToken(token, includeExpired = false) {
        if (!token) {
            return null;
        }
        // Trim and normalize the token to handle any whitespace issues
        const normalizedToken = token.trim();
        // Build query - use exact match for token (hex strings are case-insensitive, but we'll match exactly)
        const query = {
            verificationToken: normalizedToken
        };
        if (!includeExpired) {
            query.verificationTokenExpiry = { $gt: new Date() };
        }
        try {
            // First, try to find using lean() to bypass any select issues, then fetch full document
            const leanUser = await this.model.findOne({
                verificationToken: normalizedToken
            }).lean();
            if (leanUser) {
                // If found with lean, fetch the full document with field selection
                const user = await this.model
                    .findById(leanUser._id)
                    .select('+verificationToken +verificationTokenExpiry');
                if (user) {
                    // Double-check token matches (case-sensitive comparison)
                    const userToken = user.verificationToken;
                    if (userToken === normalizedToken) {
                        return user;
                    }
                    else if (process.env.NODE_ENV === 'development') {
                        console.warn('[UserRepository] Token mismatch after fetch:', {
                            expected: normalizedToken.substring(0, 20) + '...',
                            actual: userToken ? userToken.substring(0, 20) + '...' : 'null'
                        });
                    }
                }
            }
            // Fallback: Try direct query with field selection
            const user = await this.model
                .findOne(query)
                .select('+verificationToken +verificationTokenExpiry');
            if (user) {
                const userToken = user.verificationToken;
                if (userToken === normalizedToken) {
                    return user;
                }
            }
            // Enhanced debugging in development
            if (process.env.NODE_ENV === 'development') {
                // Try querying without field selection to see if token exists
                const debugUser = await this.model.findOne({
                    verificationToken: normalizedToken
                }).lean();
                if (debugUser) {
                    console.error('[UserRepository] User found but field selection failed. Token exists:', {
                        userId: debugUser._id,
                        email: debugUser.email,
                        isVerified: debugUser.isVerified,
                        hasToken: !!debugUser.verificationToken,
                        tokenInDB: debugUser.verificationToken ? debugUser.verificationToken.substring(0, 20) + '...' : 'null'
                    });
                    // Try to get the user with explicit field selection using findById
                    const userById = await this.model.findById(debugUser._id).select('+verificationToken +verificationTokenExpiry');
                    if (userById && userById.verificationToken) {
                        console.log('[UserRepository] Successfully retrieved token via findById:', {
                            tokenMatch: userById.verificationToken === normalizedToken,
                            dbToken: userById.verificationToken.substring(0, 20) + '...',
                            queryToken: normalizedToken.substring(0, 20) + '...'
                        });
                        return userById;
                    }
                }
                else {
                    // Check if any users have verification tokens (for debugging)
                    const anyUserWithToken = await this.model.findOne({
                        verificationToken: { $exists: true, $ne: null }
                    }).select('+verificationToken email isVerified').lean();
                    if (anyUserWithToken) {
                        const dbToken = anyUserWithToken.verificationToken;
                        console.log('[UserRepository] Users with verification tokens exist, but token mismatch:', {
                            dbTokenPreview: dbToken ? dbToken.substring(0, 20) + '...' : 'null',
                            queryTokenPreview: normalizedToken.substring(0, 20) + '...',
                            tokensMatch: dbToken === normalizedToken,
                            dbTokenLength: dbToken ? dbToken.length : 0,
                            queryTokenLength: normalizedToken.length
                        });
                    }
                    else {
                        // Check if there are any unverified users at all
                        const unverifiedUsers = await this.model.countDocuments({ isVerified: false });
                        console.log('[UserRepository] No users found with verification tokens. Unverified users count:', unverifiedUsers);
                        // Try to find the most recent unverified user to see what fields they have
                        const recentUser = await this.model.findOne({ isVerified: false })
                            .sort({ createdAt: -1 })
                            .select('email createdAt')
                            .lean();
                        if (recentUser) {
                            console.log('[UserRepository] Most recent unverified user:', {
                                email: recentUser.email,
                                createdAt: recentUser.createdAt
                            });
                        }
                    }
                }
            }
            return null;
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[UserRepository] Error finding user by verification token:', error);
            }
            return null;
        }
    }
    /**
     * Verify user and clear verification token
     */
    async verifyUserEmail(userId) {
        return await this.model.findByIdAndUpdate(userId, {
            isVerified: true,
            $unset: { verificationToken: '', verificationTokenExpiry: '' },
        }, { new: true });
    }
    /**
     * Update verification token
     */
    async updateVerificationToken(userId, token, expiry) {
        return await this.updateById(userId, {
            verificationToken: token,
            verificationTokenExpiry: expiry,
        });
    }
    /**
     * Find user by reset password token
     */
    async findByResetPasswordToken(token) {
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
    async updateResetPasswordToken(userId, token, expiry) {
        return await this.updateById(userId, {
            resetPasswordToken: token,
            resetPasswordTokenExpiry: expiry,
        });
    }
    /**
     * Reset password and clear reset token
     */
    async resetPassword(userId, hashedPassword) {
        return await this.model.findByIdAndUpdate(userId, {
            password: hashedPassword,
            $unset: { resetPasswordToken: '', resetPasswordTokenExpiry: '' },
        }, { new: true });
    }
}
// Export singleton instance
exports.userRepository = new UserRepository();
exports.default = exports.userRepository;
//# sourceMappingURL=UserRepository.js.map