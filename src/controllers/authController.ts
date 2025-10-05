import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful'
    });
  });

  static login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);

    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken
      },
      message: 'Login successful'
    });
  });

  static refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }

    const tokens = await AuthService.refreshToken(refreshToken);

    // Set new refresh token in cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken
      }
    });
  });

  static logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    res.clearCookie('refreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  static verifyEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Verification token is required'
      });
    }

    await AuthService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  static forgotPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.forgotPassword(req.body.email);

    res.json({
      success: true,
      message: result.message
    });
  });

  static resetPassword = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { token, password } = req.body;
    const result = await AuthService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message
    });
  });

  static getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.json({
      success: true,
      data: req.user
    });
  });
}