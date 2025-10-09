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
        return await this.model.findOne({ email: email.toLowerCase() }).select('+password');
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
     * Find user by verification token
     */
    async findByVerificationToken(token) {
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
    async verifyUserEmail(userId) {
        return await this.updateById(userId, {
            isVerified: true,
            verificationToken: undefined,
            verificationTokenExpiry: undefined,
        });
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
        return await this.updateById(userId, {
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordTokenExpiry: undefined,
        });
    }
}
// Export singleton instance
exports.userRepository = new UserRepository();
exports.default = exports.userRepository;
//# sourceMappingURL=UserRepository.js.map