import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '../types';
import config from '../config';
import { sendEmail } from './emailService';
import { AppError } from '../shared/errors/AppError';
import { userRepository } from '../repositories/UserRepository';
import { userPreferencesRepository } from '../repositories/UserPreferencesRepository';
import { logger } from '../utils/logger';

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

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async register(data: RegisterData) {
    const { email, password, firstName, lastName, role, dateOfBirth, parentEmail } = data;

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      throw AppError.conflict('User with this email already exists', 'EMAIL_EXISTS');
    }

    // Validate age for students
    if (role === UserRole.STUDENT && dateOfBirth) {
      const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
      if (age < 13 || age > 18) {
        throw AppError.badRequest('Students must be between 13 and 18 years old', 'INVALID_AGE');
      }

      // For minors, require parent email
      if (age < 18 && !parentEmail) {
        throw AppError.badRequest(
          'Parent email is required for users under 18',
          'PARENT_EMAIL_REQUIRED'
        );
      }
    }

    const hashedPassword = await this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
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

    // Handle parent account creation/linking for students
    let parentAccount = null;
    if (role === UserRole.STUDENT && parentEmail) {
      const normalizedParentEmail = parentEmail.toLowerCase().trim();

      // Check if parent account already exists
      parentAccount = await userRepository.findByEmail(normalizedParentEmail);

      if (!parentAccount) {
        // Create parent account (minimal info - they can complete profile later)
        // Extract first name from email if possible (before @)
        const emailName = normalizedParentEmail.split('@')[0];
        const parentFirstName = emailName.split('.')[0] || emailName.split('_')[0] || 'Parent';

        const parentData: any = {
          email: normalizedParentEmail,
          password: crypto.randomBytes(32).toString('hex'), // Random password - parent will need to reset
          firstName: parentFirstName,
          lastName: 'Account',
          role: UserRole.PARENT,
          isVerified: false, // Parent account doesn't need email verification for now
        };

        parentAccount = await userRepository.create(parentData);

        // Create preferences for parent
        await userPreferencesRepository.create({
          userId: parentAccount._id,
        });

        logger.info('Created parent account', { email: normalizedParentEmail });
      } else if (parentAccount.role !== UserRole.PARENT) {
        // If email exists but is not a parent, that's a conflict
        throw AppError.conflict(
          `Email ${normalizedParentEmail} is already registered with a different role`,
          'ROLE_CONFLICT'
        );
      }

      // Link student to parent
      userData.parentId = parentAccount._id;
    }

    const user = await userRepository.create(userData);

    // Verify token was saved (development only) - use repository method instead of direct model access
    if (process.env.NODE_ENV === 'development') {
      // Use findByIdWithFields to check if token was saved
      const savedUser = await userRepository.findByIdWithFields(
        user._id.toString(),
        '+verificationToken +verificationTokenExpiry'
      );
      if (savedUser) {
        const savedToken = (savedUser as any).verificationToken;
        if (savedToken !== verificationToken) {
          logger.error('Token mismatch after user creation', undefined, {
            expected: verificationToken.substring(0, 20) + '...',
            saved: savedToken ? savedToken.substring(0, 20) + '...' : 'null',
            userId: user._id.toString(),
          });
        } else {
          logger.debug('Verification token saved successfully', { email: user.email });
        }
      } else {
        logger.warn('Could not retrieve user after creation to verify token');
      }
    }

    // Create user preferences
    await userPreferencesRepository.create({
      userId: user._id,
    });

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      await this.sendVerificationEmail(user.email, verificationToken, user.firstName, user.role);
      logger.info('Verification email sent successfully', {
        email: user.email,
        role: user.role,
        userId: user._id.toString(),
      });
    } catch (emailError) {
      // Log error but don't fail registration
      logger.error('Failed to send verification email', emailError, {
        email: user.email,
        role: user.role,
        userId: user._id.toString(),
        note: 'User account created but verification email failed to send. User can request resend.',
      });
      // Continue with registration even if email fails
    }

    // If it's a student with parent email, notify parent (non-blocking)
    if (role === UserRole.STUDENT && parentEmail && parentAccount) {
      try {
        await this.sendParentNotificationEmail(parentEmail, user.firstName, user.lastName);
        logger.info('Parent notification email sent successfully', { parentEmail });
      } catch (emailError) {
        // Log error but don't fail registration
        logger.error('Failed to send parent notification email', emailError, {
          parentEmail,
          studentId: user._id.toString(),
        });
      }
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
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  static async login(data: LoginData) {
    const { email, password } = data;

    if (!email || !password) {
      throw AppError.badRequest('Email and password are required', 'MISSING_CREDENTIALS');
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    const user = await userRepository.findByEmailWithPassword(normalizedEmail);

    if (!user) {
      logger.warn('Login failed - User not found', { email: normalizedEmail });
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password field was retrieved
    if (!user.password) {
      logger.error('Login failed - Password field not retrieved', undefined, {
        email: normalizedEmail,
        userId: user._id.toString(),
      });
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // Verify password hash format before comparison
    const isHashFormat = /^\$2[ayb]\$.{56}$/.test(user.password);

    logger.debug('Password comparison', {
      email: normalizedEmail,
      passwordHashFormat: isHashFormat ? 'valid' : 'invalid',
    });

    // Try standard password comparison
    let isPasswordValid = await this.comparePassword(password, user.password);

    // If comparison fails and hash format is valid, check if this might be a double-hashed password
    // (from before the fix). We can't reverse a hash, so we provide a helpful error message.
    if (!isPasswordValid && isHashFormat) {
      logger.warn('Password comparison failed - possible double-hashing issue', {
        email: normalizedEmail,
        userId: user._id.toString(),
      });
      // Provide a helpful error message without revealing too much
      throw AppError.unauthorized(
        "Invalid email or password. If you're having trouble logging in, please use the 'Forgot Password' feature to reset your password.",
        'INVALID_CREDENTIALS'
      );
    }

    if (!isPasswordValid) {
      logger.warn('Login failed - Password mismatch', {
        email: normalizedEmail,
        userId: user._id.toString(),
      });
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.isVerified) {
      throw AppError.unauthorized(
        'Please verify your email address before logging in',
        'EMAIL_NOT_VERIFIED'
      );
    }

    // Check if user should get daily login points
    const lastLogin = (user as any).lastLoginAt;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let pointsAwarded = 0;
    let streakUpdated = false;

    if (lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      lastLoginDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor(
        (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Award points if logging in on a new day
      if (daysDiff > 0) {
        pointsAwarded = 10; // Daily login bonus
        (user as any).totalPoints = ((user as any).totalPoints || 0) + pointsAwarded;

        // Update streak
        if (daysDiff === 1) {
          // Consecutive day
          (user as any).streakCount = ((user as any).streakCount || 0) + 1;
          streakUpdated = true;
        } else {
          // Streak broken
          (user as any).streakCount = 1;
          streakUpdated = true;
        }
      }
    } else {
      // First login ever
      pointsAwarded = 10;
      (user as any).totalPoints = ((user as any).totalPoints || 0) + pointsAwarded;
      (user as any).streakCount = 1;
      streakUpdated = true;
    }

    // Update last login
    (user as any).lastLoginAt = new Date();
    await (user as any).save();

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
      dailyLoginBonus: pointsAwarded > 0 ? { points: pointsAwarded, streakUpdated } : undefined,
    };
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;

      const user = await userRepository.findByIdWithFields(decoded.userId, 'email role isVerified');

      if (!user || !user.isVerified) {
        throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
      }

      const tokens = this.generateTokens(user._id.toString());
      return tokens;
    } catch (error) {
      logger.debug('Refresh token verification failed', { error });
      throw AppError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
  }

  static async verifyEmail(token: string) {
    if (!token) {
      throw AppError.badRequest('Verification token is required', 'MISSING_TOKEN');
    }

    // Normalize token: trim whitespace
    let normalizedToken = token.trim();

    // Handle URL encoding - Express already decodes query params, but handle edge cases
    // Only decode if it looks like it might be encoded (contains %)
    if (normalizedToken.includes('%')) {
      try {
        // Decode once (Express should have already decoded, but handle double-encoding)
        normalizedToken = decodeURIComponent(normalizedToken);
        // If still contains %, decode again (handles double-encoding)
        if (normalizedToken.includes('%')) {
          normalizedToken = decodeURIComponent(normalizedToken);
        }
      } catch (e) {
        // If decoding fails, use the original token
        // This handles malformed encoding or tokens that aren't actually encoded
        if (process.env.NODE_ENV === 'development') {
          const errorMessage = e instanceof Error ? e.message : String(e);
          logger.warn('[AuthService] URL decoding failed, using original token', { errorMessage });
        }
      }
    }

    // Validate token format (should be 64 hex characters from crypto.randomBytes(32))
    if (!/^[a-f0-9]{64}$/i.test(normalizedToken)) {
      logger.warn('Invalid token format', {
        length: normalizedToken.length,
        preview: normalizedToken.substring(0, 20) + '...',
      });
      throw AppError.badRequest('Invalid verification token format', 'INVALID_TOKEN_FORMAT');
    }

    // Try to find user by token (including expired ones to check if already verified)
    let user = await userRepository.findByVerificationToken(normalizedToken, true);

    // If not found, try with original token (in case normalization changed it incorrectly)
    if (!user && normalizedToken !== token.trim()) {
      const originalToken = token.trim();
      logger.debug('Retrying with original token format');
      user = await userRepository.findByVerificationToken(originalToken, true);
    }

    if (!user) {
      logger.warn('Token lookup failed', {
        tokenLength: normalizedToken.length,
        tokenFormat: /^[a-f0-9]{64}$/i.test(normalizedToken) ? 'valid' : 'invalid',
      });
      throw AppError.badRequest(
        'Invalid verification token. The link may have expired or already been used.',
        'INVALID_VERIFICATION_TOKEN'
      );
    }

    // Check if already verified
    if (user.isVerified) {
      return {
        message: 'Email already verified. You can now log in.',
      };
    }

    // Check if token has expired
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      throw AppError.badRequest(
        'Verification token has expired. Please request a new verification email.',
        'TOKEN_EXPIRED'
      );
    }

    // Verify the user and clear verification token
    await userRepository.verifyUserEmail(user._id.toString());

    return {
      message: 'Email verified successfully! You can now log in.',
    };
  }

  static async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message:
          'If an account with that email exists and is not verified, we have sent a verification email.',
      };
    }

    // Check if already verified
    if (user.isVerified) {
      throw AppError.badRequest('Email is already verified', 'ALREADY_VERIFIED');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await userRepository.updateVerificationToken(
      user._id.toString(),
      verificationToken,
      verificationTokenExpiry
    );

    // Send verification email
    await this.sendVerificationEmail(user.email, verificationToken, user.firstName, user.role);

    return {
      message:
        'If an account with that email exists and is not verified, we have sent a verification email.',
    };
  }

  static async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists for security
      return {
        message: 'If an account with that email exists, we have sent a password reset link.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
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
      message: 'If an account with that email exists, we have sent a password reset link.',
    };
  }

  static async resetPassword(token: string, newPassword: string) {
    if (!token) {
      throw AppError.badRequest('Reset token is required', 'MISSING_TOKEN');
    }

    if (!newPassword || newPassword.length < 8) {
      throw AppError.badRequest('Password must be at least 8 characters long', 'INVALID_PASSWORD');
    }

    // Find user by reset token
    const user = await userRepository.findByResetPasswordToken(token);

    if (!user) {
      throw AppError.badRequest('Invalid or expired reset token', 'INVALID_RESET_TOKEN');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update user password and clear reset token
    await userRepository.resetPassword(user._id.toString(), hashedPassword);

    return { message: 'Password reset successful. You can now log in with your new password.' };
  }

  private static async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
    role: UserRole
  ) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${token}`;

    logger.debug('Preparing to send verification email', {
      email,
      role,
      verificationUrl: verificationUrl.substring(0, 50) + '...',
      frontendUrl: config.frontendUrl,
    });

    // Determine template based on role
    const isStudent = role === UserRole.STUDENT;
    const isTutor = role === UserRole.TUTOR;

    const subject = isStudent
      ? `Welcome ${firstName}! Verify your Behavioral Learning Platform account`
      : isTutor
        ? `Welcome ${firstName}! Verify your tutor account`
        : `Verify your Behavioral Learning Platform account`;

    // Student-specific template
    const htmlTemplate = isStudent
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">Welcome ${firstName}! 🎓</h1>
            <p style="color: #64748b; margin-top: 10px; font-size: 16px;">Welcome to Behavioral Learning Platform</p>
          </div>
          
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Hi ${firstName},
          </p>
          
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            We're excited to have you join our learning community! To get started, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
              Verify My Email Address
            </a>
          </div>
          
          <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              <strong>What's next after verification?</strong>
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #64748b; font-size: 14px;">
              <li>Complete your profile setup</li>
              <li>Set your learning goals</li>
              <li>Schedule your first study session</li>
              <li>Connect with qualified tutors</li>
              <li>Start earning points and badges!</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
            <strong>Having trouble clicking the button?</strong><br>
            Copy and paste this link into your browser:
          </p>
          <p style="color: #3b82f6; word-break: break-all; font-size: 12px; background-color: #f1f5f9; padding: 10px; border-radius: 4px; margin: 10px 0;">
            ${verificationUrl}
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Happy learning!<br>
              <strong style="color: #3b82f6;">LearnQuest Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
      : isTutor
        ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0; font-size: 28px;">Welcome ${firstName}! 👨‍🏫</h1>
            <p style="color: #64748b; margin-top: 10px; font-size: 16px;">Welcome to Behavioral Learning Platform</p>
          </div>
          
          <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
            Hi ${firstName},
          </p>
          
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Thank you for joining our platform as a tutor! We're excited to have you help students on their learning journey. Please verify your email address to get started.
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" style="background-color: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
              Verify My Email Address
            </a>
          </div>
          
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              <strong>What's next after verification?</strong>
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #64748b; font-size: 14px;">
              <li>Complete your tutor profile</li>
              <li>Add your qualifications and subjects</li>
              <li>Set your availability and rates</li>
              <li>Start connecting with students</li>
              <li>Build your teaching reputation!</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 13px; margin-top: 30px;">
            <strong>Having trouble clicking the button?</strong><br>
            Copy and paste this link into your browser:
          </p>
          <p style="color: #10b981; word-break: break-all; font-size: 12px; background-color: #f1f5f9; padding: 10px; border-radius: 4px; margin: 10px 0;">
            ${verificationUrl}
          </p>
          
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            If you didn't create an account, you can safely ignore this email.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              Best regards,<br>
              <strong style="color: #10b981;">LearnQuest Team</strong>
            </p>
          </div>
        </div>
      </div>
    `
        : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #3b82f6;">Welcome ${firstName}!</h1>
        <p>Please click the link below to verify your email address:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #64748b; word-break: break-all; font-size: 12px;">${verificationUrl}</p>
        <p style="color: #64748b; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    const textContent = isStudent
      ? `Welcome ${firstName} to Behavioral Learning Platform!

We're excited to have you join our learning community! Please verify your email address by clicking the link below:
${verificationUrl}

What's next after verification?
- Complete your profile setup
- Set your learning goals
- Schedule your first study session
- Connect with qualified tutors
- Start earning points and badges!

If you didn't create an account, you can safely ignore this email.

Happy learning!
LearnQuest Team`
      : isTutor
        ? `Welcome ${firstName} to Behavioral Learning Platform!

Thank you for joining our platform as a tutor! Please verify your email address by clicking the link below:
${verificationUrl}

What's next after verification?
- Complete your tutor profile
- Add your qualifications and subjects
- Set your availability and rates
- Start connecting with students
- Build your teaching reputation!

If you didn't create an account, you can safely ignore this email.

Best regards,
LearnQuest Team`
        : `Welcome ${firstName} to Behavioral Learning Platform!

Please click the link below to verify your email address:
${verificationUrl}

If you didn't create an account, you can safely ignore this email.`;

    await sendEmail({
      to: email,
      subject,
      text: textContent,
      html: htmlTemplate,
    });

    logger.info('Verification email sent', { email, role });
  }

  private static async sendParentNotificationEmail(
    parentEmail: string,
    childFirstName: string,
    childLastName: string
  ) {
    await sendEmail({
      to: parentEmail,
      subject: 'Your child has registered for Behavioral Learning Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
              🎓 Account Registration Notification
            </h1>
          </div>

          <!-- Main Content -->
          <div style="padding: 30px 20px; background-color: #ffffff;">
            <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 20px 0;">
              Hello,
            </p>

            <p style="font-size: 16px; line-height: 1.6; color: #1f2937; margin: 0 0 20px 0;">
              We're excited to inform you that <strong>${childFirstName} ${childLastName}</strong> has successfully registered for an account on the <strong>Behavioral Learning Platform</strong>.
            </p>

            <!-- Info Box -->
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                📊 What to Expect
              </h2>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937; line-height: 1.8;">
                <li style="margin-bottom: 8px;">
                  <strong>Weekly Progress Reports:</strong> You'll receive detailed email reports every Monday about your child's learning progress, achievements, and engagement.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Goal Tracking:</strong> Monitor your child's progress toward academic goals and milestone achievements.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>Engagement Insights:</strong> Stay informed about your child's study habits, consistency, and learning patterns.
                </li>
                <li style="margin-bottom: 8px;">
                  <strong>At-Risk Alerts:</strong> Receive notifications if your child needs additional support or shows signs of disengagement.
                </li>
              </ul>
            </div>

            <!-- Support Box -->
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">
                💬 Need Help or Have Questions?
              </h2>
              <p style="color: #78350f; margin: 0; line-height: 1.6; font-size: 15px;">
                <strong>You can simply reply to this email</strong> with any questions, concerns, or requests. Our support team will respond promptly to assist you with:
              </p>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #78350f; line-height: 1.8; font-size: 14px;">
                <li>Understanding your child's progress reports</li>
                <li>Account-related inquiries</li>
                <li>Privacy and safety questions</li>
                <li>General platform information</li>
              </ul>
            </div>

            <!-- Additional Info -->
            <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 4px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                <strong>Note:</strong> As a parent/guardian, you have read-only access to monitor your child's learning journey. This ensures your child can learn independently while keeping you informed about their progress.
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                We're committed to supporting your child's academic success through personalized learning and behavioral tracking.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">
                Best regards,<br>
                <strong style="color: #1f2937;">The Behavioral Learning Platform Team</strong>
              </p>
            </div>
          </div>

          <!-- Bottom Border -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); height: 4px; border-radius: 0 0 8px 8px;"></div>
        </div>
      `,
    });
  }

  private static async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Reset your password - Behavioral Learning Platform',
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
            LearnQuest Team
          </p>
        </div>
      `,
    });
  }
}
