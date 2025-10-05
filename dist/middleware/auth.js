"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const models_1 = require("../models");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error('No token provided');
            error.statusCode = 401;
            return next(error);
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await models_1.User.findById(decoded.userId).select('email role subscriptionTier isVerified');
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 401;
            return next(error);
        }
        if (!user.isVerified) {
            const error = new Error('Please verify your email address');
            error.statusCode = 401;
            return next(error);
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
        const authError = new Error('Invalid token');
        authError.statusCode = 401;
        next(authError);
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            const error = new Error('Authentication required');
            error.statusCode = 401;
            return next(error);
        }
        if (!roles.includes(req.user.role)) {
            const error = new Error('Insufficient permissions');
            error.statusCode = 403;
            return next(error);
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