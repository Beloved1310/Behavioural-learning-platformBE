import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "../types";
import config from "../config";
import { sendEmail } from "./emailService";
import { AppError } from "../middleware/errorHandler";
import { userRepository } from "../repositories/UserRepository";
import { userPreferencesRepository } from "../repositories/UserPreferencesRepository";

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

export class AuthService {
  static generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expire } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId },
      config.jwt.refreshSecret as string,
      { expiresIn: config.jwt.refreshExpire } as SignOptions
    );

    return { accessToken, refreshToken };
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async register(data: RegisterData) {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      dateOfBirth,
      parentEmail,
    } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      const error: AppError = new Error("User with this email already exists");
      error.statusCode = 400;
      throw error;
    }

    // Validate age for students
    if (role === UserRole.STUDENT && dateOfBirth) {
      const age =
        new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
      if (age < 13 || age > 18) {
        const error: AppError = new Error(
          "Students must be between 13 and 18 years old"
        );
        error.statusCode = 400;
        throw error;
      }

      // For minors, require parent email
      if (age < 18 && !parentEmail) {
        const error: AppError = new Error(
          "Parent email is required for users under 18"
        );
        error.statusCode = 400;
        throw error;
      }
    }

    const hashedPassword = await this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const userData: any = {
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
    if (role === UserRole.STUDENT) {
      userData.academicGoals = [];
    } else if (role === UserRole.TUTOR) {
      userData.subjects = [];
      userData.qualifications = [];
    }

    const user = await userRepository.create(userData);

    // Create user preferences
    await userPreferencesRepository.create({
      userId: user._id,
    });

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    // If it's a student with parent email, notify parent
    if (role === UserRole.STUDENT && parentEmail) {
      await this.sendParentNotificationEmail(
        parentEmail,
        user.firstName,
        user.lastName
      );
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
      message:
        "Registration successful. Please check your email to verify your account.",
    };
  }

  static async login(data: LoginData) {
    const { email, password } = data;

    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      const error: AppError = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      const error: AppError = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    if (!user.isVerified) {
      const error: AppError = new Error(
        "Please verify your email address before logging in"
      );
      error.statusCode = 401;
      throw error;
    }

    // Update last login
    await userRepository.updateLastLogin(user._id.toString());

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

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      const user = await userRepository.findByIdWithFields(
        decoded.userId,
        "email role isVerified"
      );

      if (!user || !user.isVerified) {
        const error: AppError = new Error("Invalid refresh token");
        error.statusCode = 401;
        throw error;
      }

      const tokens = this.generateTokens(user._id.toString());
      return tokens;
    } catch (error) {
      const authError: AppError = new Error("Invalid refresh token");
      authError.statusCode = 401;
      throw authError;
    }
  }

  static async verifyEmail(token: string) {
    if (!token) {
      const error: AppError = new Error("Verification token is required");
      error.statusCode = 400;
      throw error;
    }

    // Find user by verification token
    const user = await userRepository.findByVerificationToken(token);

    if (!user) {
      const error: AppError = new Error("Invalid or expired verification token");
      error.statusCode = 400;
      throw error;
    }

    // Check if already verified
    if (user.isVerified) {
      return {
        message: "Email already verified. You can now log in.",
      };
    }

    // Verify the user and clear verification token
    await userRepository.verifyUserEmail(user._id.toString());

    return {
      message: "Email verified successfully! You can now log in.",
    };
  }

  static async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If an account with that email exists and is not verified, we have sent a verification email.",
      };
    }

    // Check if already verified
    if (user.isVerified) {
      const error: AppError = new Error("Email is already verified");
      error.statusCode = 400;
      throw error;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await userRepository.updateVerificationToken(
      user._id.toString(),
      verificationToken,
      verificationTokenExpiry
    );

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken);

    return {
      message:
        "If an account with that email exists and is not verified, we have sent a verification email.",
    };
  }

  static async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If an account with that email exists, we have sent a password reset link.",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await userRepository.updateResetPasswordToken(
      user._id.toString(),
      resetToken,
      resetTokenExpiry
    );

    // Send password reset email
    await this.sendPasswordResetEmail(email, resetToken);

    return {
      message:
        "If an account with that email exists, we have sent a password reset link.",
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token) {
      const error: AppError = new Error("Reset token is required");
      error.statusCode = 400;
      throw error;
    }

    if (!newPassword || newPassword.length < 8) {
      const error: AppError = new Error("Password must be at least 8 characters long");
      error.statusCode = 400;
      throw error;
    }

    // Find user by reset token
    const user = await userRepository.findByResetPasswordToken(token);

    if (!user) {
      const error: AppError = new Error("Invalid or expired reset token");
      error.statusCode = 400;
      throw error;
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password and clear reset token
    await userRepository.resetPassword(user._id.toString(), hashedPassword);

    return { message: "Password reset successful. You can now log in with your new password." };
  }

  private static async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    await sendEmail({
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

  private static async sendParentNotificationEmail(
    parentEmail: string,
    childFirstName: string,
    childLastName: string
  ) {
    await sendEmail({
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

  private static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    await sendEmail({
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
