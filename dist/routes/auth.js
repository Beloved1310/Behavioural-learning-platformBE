"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', authController_1.AuthController.register);
router.post('/login', authController_1.AuthController.login);
router.post('/refresh', authController_1.AuthController.refreshToken);
router.post('/logout', authController_1.AuthController.logout);
router.get('/verify-email', authController_1.AuthController.verifyEmail);
router.post('/forgot-password', authController_1.AuthController.forgotPassword);
router.post('/reset-password', authController_1.AuthController.resetPassword);
// Protected routes
router.get('/profile', auth_1.authenticate, authController_1.AuthController.getProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map