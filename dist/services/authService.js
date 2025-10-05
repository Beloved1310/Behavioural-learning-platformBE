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
const models_1 = require("../models");
const emailService_1 = require("./emailService");
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
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            const error = new Error("User with this email already exists");
            error.statusCode = 400;
            throw error;
        }
        // Validate age for students
        if (role === types_1.UserRole.STUDENT && dateOfBirth) {
            const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
            if (age < 13 || age > 18) {
                const error = new Error("Students must be between 13 and 18 years old");
                error.statusCode = 400;
                throw error;
            }
            // For minors, require parent email
            if (age < 18 && !parentEmail) {
                const error = new Error("Parent email is required for users under 18");
                error.statusCode = 400;
                throw error;
            }
        }
        const hashedPassword = await this.hashPassword(password);
        const verificationToken = crypto_1.default.randomBytes(32).toString("hex");
        // Create user
        const userData = {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        };
        // Add role-specific fields
        if (role === types_1.UserRole.STUDENT) {
            userData.academicGoals = [];
        }
        else if (role === types_1.UserRole.TUTOR) {
            userData.subjects = [];
            userData.qualifications = [];
        }
        const user = await models_1.User.create(userData);
        // Create user preferences
        await models_1.UserPreferences.create({
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
        const user = await models_1.User.findOne({ email }).select("+password");
        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }
        const isPasswordValid = await this.comparePassword(password, user.password);
        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }
        if (!user.isVerified) {
            const error = new Error("Please verify your email address before logging in");
            error.statusCode = 401;
            throw error;
        }
        // Update last login
        await models_1.User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
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
            const user = await models_1.User.findById(decoded.userId).select("email role isVerified");
            if (!user || !user.isVerified) {
                const error = new Error("Invalid refresh token");
                error.statusCode = 401;
                throw error;
            }
            const tokens = this.generateTokens(user._id.toString());
            return tokens;
        }
        catch (error) {
            const authError = new Error("Invalid refresh token");
            authError.statusCode = 401;
            throw authError;
        }
    }
    static async verifyEmail(token) {
        // In a real implementation, you'd store verification tokens in the database
        // For this example, we'll simulate the verification process
        const error = new Error("Invalid or expired verification token");
        error.statusCode = 400;
        throw error;
    }
    static async forgotPassword(email) {
        const user = await models_1.User.findOne({ email });
        if (!user) {
            // Don't reveal if email exists for security
            return {
                message: "If an account with that email exists, we have sent a password reset link.",
            };
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        // In a real implementation, store reset token in database
        await this.sendPasswordResetEmail(email, resetToken);
        return {
            message: "If an account with that email exists, we have sent a password reset link.",
        };
    }
    static async resetPassword(token, newPassword) {
        // In a real implementation, verify reset token from database
        const hashedPassword = await this.hashPassword(newPassword);
        // Update user password
        // await prisma.user.update({
        //   where: { resetToken: token },
        //   data: {
        //     password: hashedPassword,
        //     resetToken: null,
        //     resetTokenExpiry: null
        //   }
        // });
        return { message: "Password reset successful" };
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
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map