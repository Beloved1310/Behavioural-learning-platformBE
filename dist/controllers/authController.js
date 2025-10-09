"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("../services/authService");
const errorHandler_1 = require("../middleware/errorHandler");
class AuthController {
}
exports.AuthController = AuthController;
_a = AuthController;
AuthController.register = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const result = await authService_1.AuthService.register(req.body);
    res.status(201).json({
        success: true,
        data: result,
        message: 'Registration successful'
    });
});
AuthController.login = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const result = await authService_1.AuthService.login(req.body);
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
AuthController.refreshToken = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            error: 'No refresh token provided'
        });
    }
    const tokens = await authService_1.AuthService.refreshToken(refreshToken);
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
AuthController.logout = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    res.clearCookie('refreshToken');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});
AuthController.verifyEmail = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Verification token is required'
        });
    }
    const result = await authService_1.AuthService.verifyEmail(token);
    res.json({
        success: true,
        message: result.message
    });
});
AuthController.resendVerificationEmail = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }
    const result = await authService_1.AuthService.resendVerificationEmail(email);
    res.json({
        success: true,
        message: result.message
    });
});
AuthController.forgotPassword = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const result = await authService_1.AuthService.forgotPassword(req.body.email);
    res.json({
        success: true,
        message: result.message
    });
});
AuthController.resetPassword = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    const { token, password } = req.body;
    const result = await authService_1.AuthService.resetPassword(token, password);
    res.json({
        success: true,
        message: result.message
    });
});
AuthController.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res, next) => {
    res.json({
        success: true,
        data: req.user
    });
});
//# sourceMappingURL=authController.js.map