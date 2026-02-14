"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const models_1 = require("../models");
const AppError_1 = require("../shared/errors/AppError");
const logger_1 = require("../utils/logger");
/**
 * Authentication middleware
 * Verifies JWT token and attaches user information to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(AppError_1.AppError.unauthorized('No token provided', 'NO_TOKEN'));
        }
        const token = authHeader.substring(7);
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        }
        catch (jwtError) {
            logger_1.logger.debug('JWT verification failed', { error: jwtError });
            return next(AppError_1.AppError.unauthorized('Invalid or expired token', 'INVALID_TOKEN'));
        }
        const user = await models_1.User.findById(decoded.userId).select('email role subscriptionTier isVerified');
        if (!user) {
            logger_1.logger.warn('User not found during authentication', { userId: decoded.userId });
            return next(AppError_1.AppError.unauthorized('User not found', 'USER_NOT_FOUND'));
        }
        if (!user.isVerified) {
            return next(AppError_1.AppError.unauthorized('Please verify your email address', 'EMAIL_NOT_VERIFIED'));
        }
        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            subscriptionTier: user.subscriptionTier,
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error', error);
        next(AppError_1.AppError.unauthorized('Authentication failed', 'AUTH_ERROR'));
    }
};
exports.authenticate = authenticate;
/**
 * Authorization middleware factory
 * Checks if the authenticated user has one of the required roles
 *
 * @param roles - Array of allowed roles
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * router.get('/admin', authenticate, authorize(UserRole.ADMIN), adminController.get);
 * ```
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(AppError_1.AppError.unauthorized('Authentication required', 'AUTH_REQUIRED'));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.warn('Authorization failed', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                path: req.path,
            });
            return next(AppError_1.AppError.forbidden('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS'));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Optional authentication middleware
 * Attempts to authenticate user but doesn't fail if token is missing or invalid
 * Useful for endpoints that work differently for authenticated vs anonymous users
 */
const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    try {
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await models_1.User.findById(decoded.userId).select('email role subscriptionTier isVerified');
        if (user && user.isVerified) {
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier,
            };
        }
    }
    catch (error) {
        // Silently ignore authentication errors for optional auth
        // This allows the request to proceed without authentication
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map