import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { UserRole } from "../types";
import config from "../config";
import { User, UserPreferences } from "../models";
import { sendEmail } from "./emailService";
import { AppError } from "../middleware/errorHandler";

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
    const existingUser = await User.findOne({ email });

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

    // Create user
    const userData: any = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    // Add role-specific fields
    if (role === UserRole.STUDENT) {
      userData.academicGoals = [];
    } else if (role === UserRole.TUTOR) {
      userData.subjects = [];
      userData.qualifications = [];
    }

    const user = await User.create(userData);

    // Create user preferences
    await UserPreferences.create({
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

    const user = await User.findOne({ email }).select("+password");

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
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

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

      const user = await User.findById(decoded.userId).select(
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
    // In a real implementation, you'd store verification tokens in the database
    // For this example, we'll simulate the verification process

    const error: AppError = new Error("Invalid or expired verification token");
    error.statusCode = 400;
    throw error;
  }

  static async forgotPassword(email: string) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          "If an account with that email exists, we have sent a password reset link.",
      };
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // In a real implementation, store reset token in database

    await this.sendPasswordResetEmail(email, resetToken);

    return {
      message:
        "If an account with that email exists, we have sent a password reset link.",
    };
  }

  static async resetPassword(token: string, newPassword: string) {
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
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `,
    });
  }
}
