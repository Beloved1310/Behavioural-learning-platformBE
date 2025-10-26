"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const models_1 = require("../models");
const errorHandler_1 = require("./errorHandler");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new errorHandler_1.AppError('No token provided', 401));
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await models_1.User.findById(decoded.userId).select('email role subscriptionTier isVerified');
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 401));
        }
        if (!user.isVerified) {
            return next(new errorHandler_1.AppError('Please verify your email address', 401));
        }
        if (user) {
            req.user = {
                id: user._id.toString(),
                email: user.email,
                role: user.role,
                subscriptionTier: user.subscriptionTier
            };
        }
        next();
    }
    catch (error) {
        next(new errorHandler_1.AppError('Invalid token', 401));
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errorHandler_1.AppError('Insufficient permissions', 403));
        }
        next();
    };
};
exports.authorize = authorize;
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
            if (user) {
                req.user = {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                    subscriptionTier: user.subscriptionTier
                };
            }
        }
    }
    catch (error) {
        // Ignore authentication errors for optional auth
    }
    next();
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map