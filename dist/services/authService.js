"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("../types");
const config_1 = __importDefault(require("../config"));
const emailService_1 = require("./emailService");
const errorHandler_1 = require("../middleware/errorHandler");
const UserRepository_1 = require("../repositories/UserRepository");
const UserPreferencesRepository_1 = require("../repositories/UserPreferencesRepository");
class AuthService {
    static generateTokens(userId) {
        const accessToken = jsonwebtoken_1.default.sign({ userId }, config_1.default.jwt.secret, { expiresIn: config_1.default.jwt.expire });
        const refreshToken = jsonwebtoken_1.default.sign({ userId }, config_1.default.jwt.refreshSecret, { expiresIn: config_1.default.jwt.refreshExpire });
        return { accessToken, refreshToken };
    }
    static async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 12);
    }
    static async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    static async register(data) {
        const { email, password, firstName, lastName, role, dateOfBirth, parentEmail, } = data;
        // Check if user already exists
        const existingUser = await UserRepository_1.userRepository.findByEmail(email);
        if (existingUser) {
            throw new errorHandler_1.AppError("User with this email already exists", 400);
        }
        // Validate age for students
        if (role === types_1.UserRole.STUDENT && dateOfBirth) {
            const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
            if (age < 13 || age > 18) {
                throw new errorHandler_1.AppError("Students must be between 13 and 18 years old", 400);
            }
            // For minors, require parent email
            if (age < 18 && !parentEmail) {
                throw new errorHandler_1.AppError("Parent email is required for users under 18", 400);
            }
        }
        const hashedPassword = await this.hashPassword(password);
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Create user
        const userData = {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            verificationToken,
            verificationTokenExpiry,
        };
        // Add role-specific fields
        if (role === types_1.UserRole.STUDENT) {
            userData.academicGoals = [];
        }
        else if (role === types_1.UserRole.TUTOR) {
            userData.subjects = [];
            userData.qualifications = [];
        }
        const user = await UserRepository_1.userRepository.create(userData);
        // Create user preferences
        await UserPreferencesRepository_1.userPreferencesRepository.create({
            userId: user._id,
        });
        // Send verification email
        await this.sendVerificationEmail(user.email, verificationToken);
        // If it's a student with parent email, notify parent
        if (role === types_1.UserRole.STUDENT && parentEmail) {
            await this.sendParentNotificationEmail(parentEmail, user.firstName, user.lastName);
        }
        return {
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isVerified: user.isVerified,
                subscriptionTier: user.subscriptionTier,
                createdAt: user.createdAt,
            },
            message: "Registration successful. Please check your email to verify your account.",
        };
    }
    static async login(data) {
        const { email, password } = data;
        const user = await UserRepository_1.userRepository.findByEmailWithPassword(email);
        if (!user) {
            throw new errorHandler_1.AppError("Invalid email or password", 401);
        }
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new errorHandler_1.AppError("Invalid email or password", 401);
        }
        if (!user.isVerified) {
            throw new errorHandler_1.AppError("Please verify your email address before logging in", 401);
        }
        // Update last login
        await UserRepository_1.userRepository.updateLastLogin(user._id.toString());
        const tokens = this.generateTokens(user._id.toString());
        const userWithoutPassword = {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            subscriptionTier: user.subscriptionTier,
            profileImage: user.profileImage,
            lastLoginAt: user.lastLoginAt,
        };
        return {
            user: userWithoutPassword,
            tokens,
        };
    }
    static async refreshToken(refreshToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.refreshSecret);
            const user = await UserRepository_1.userRepository.findByIdWithFields(decoded.userId, "email role isVerified");
            if (!user || !user.isVerified) {
                throw new errorHandler_1.AppError("Invalid refresh token", 401);
            }
            const tokens = this.generateTokens(user._id.toString());
            return tokens;
        }
        catch (error) {
            throw new errorHandler_1.AppError("Invalid refresh token", 401);
        }
    }
    static async verifyEmail(token) {
        if (!token) {
            throw new errorHandler_1.AppError("Verification token is required", 400);
        }
        // Find user by verification token
        const user = await UserRepository_1.userRepository.findByVerificationToken(token);
        if (!user) {
            throw new errorHandler_1.AppError("Invalid or expired verification token", 400);
        }
        // Check if already verified
        if (user.isVerified) {
            return {
                message: "Email already verified. You can now log in.",
            };
        }
        // Verify the user and clear verification token
        await UserRepository_1.userRepository.verifyUserEmail(user._id.toString());
        return {
            message: "Email verified successfully! You can now log in.",
        };
    }
    static async resendVerificationEmail(email) {
        const user = await UserRepository_1.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists for security
            return {
                message: "If an account with that email exists and is not verified, we have sent a verification email.",
            };
        }
        // Check if already verified
        if (user.isVerified) {
            throw new errorHandler_1.AppError("Email is already verified", 400);
        }
        // Generate new verification token
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Update user with new token
        await UserRepository_1.userRepository.updateVerificationToken(user._id.toString(), verificationToken, verificationTokenExpiry);
        // Send verification email
        await this.sendVerificationEmail(user.email, verificationToken);
        return {
            message: "If an account with that email exists and is not verified, we have sent a verification email.",
        };
    }
    static async forgotPassword(email) {
        const user = await UserRepository_1.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists for security
            return {
                message: "If an account with that email exists, we have sent a password reset link.",
            };
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        // Store reset token in database
        await UserRepository_1.userRepository.updateResetPasswordToken(user._id.toString(), resetToken, resetTokenExpiry);
        // Send password reset email
        await this.sendPasswordResetEmail(email, resetToken);
        return {
            message: "If an account with that email exists, we have sent a password reset link.",
        };
    }
    static async resetPassword(token, newPassword) {
        if (!token) {
            throw new errorHandler_1.AppError("Reset token is required", 400);
        }
        if (!newPassword || newPassword.length < 8) {
            throw new errorHandler_1.AppError("Password must be at least 8 characters long", 400);
        }
        // Find user by reset token
        const user = await UserRepository_1.userRepository.findByResetPasswordToken(token);
        if (!user) {
            throw new errorHandler_1.AppError("Invalid or expired reset token", 400);
        }
        // Hash new password
        const hashedPassword = await this.hashPassword(newPassword);
        // Update user password and clear reset token
        await UserRepository_1.userRepository.resetPassword(user._id.toString(), hashedPassword);
        return { message: "Password reset successful. You can now log in with your new password." };
    }
    static async sendVerificationEmail(email, token) {
        const verificationUrl = `${config_1.default.frontendUrl}/verify-email?token=${token}`;
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: "Verify your Behavioral Learning Platform account",
            html: `
        <h1>Welcome to Behavioral Learning Platform!</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
        });
    }
    static async sendParentNotificationEmail(parentEmail, childFirstName, childLastName) {
        await (0, emailService_1.sendEmail)({
            to: parentEmail,
            subject: "Your child has registered for Behavioral Learning Platform",
            html: `
        <h1>Account Registration Notification</h1>
        <p>Your child ${childFirstName} ${childLastName} has registered for an account on the Behavioral Learning Platform.</p>
        <p>As their parent/guardian, you will receive regular progress reports and can monitor their learning journey.</p>
        <p>If you have any questions, please contact our support team.</p>
      `,
        });
    }
    static async sendPasswordResetEmail(email, token) {
        const resetUrl = `${config_1.default.frontendUrl}/reset-password?token=${token}`;
        await (0, emailService_1.sendEmail)({
            to: email,
            subject: "Reset your password - Behavioral Learning Platform",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #3b82f6;">Password Reset Request</h1>
          <p>You requested to reset your password for your Behavioral Learning Platform account.</p>

          <p>Click the button below to reset your password:</p>

          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #64748b; word-break: break-all;">${resetUrl}</p>

          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>

          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

          <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
            Best regards,<br>
            The Behavioral Learning Platform Team
          </p>
        </div>
      `,
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map