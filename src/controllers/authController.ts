import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../shared/errors/AppError';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  });

  static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      message: 'Login successful',
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return next(AppError.unauthorized('No refresh token provided', 'NO_REFRESH_TOKEN'));
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    // Set new refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
      },
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    let { token } = req.query;

    if (!token) {
      return next(AppError.badRequest('Verification token is required', 'MISSING_TOKEN'));
    }

    // Ensure token is a string
    if (typeof token !== 'string') {
      token = String(token);
    }

    // Normalize token: trim whitespace
    token = token.trim();

    // The service will handle URL decoding and validation
    // We just pass the token as-is from the query parameter
    const result = await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: result.message,
    });
  });

  static resendVerificationEmail = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { email } = req.body;

      if (!email) {
        return next(AppError.badRequest('Email is required', 'MISSING_EMAIL'));
      }

      const result = await AuthService.resendVerificationEmail(email);

      res.json({
        success: true,
        message: result.message,
      });
    }
  );

  static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.forgotPassword(req.body.email);

    res.json({
      success: true,
      message: result.message,
    });
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message,
    });
  });

  static getProfile = asyncHandler(
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      res.json({
        success: true,
        data: req.user,
      });
    }
  );
}
