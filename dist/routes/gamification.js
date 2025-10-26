"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamificationController_1 = require("../controllers/gamificationController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Quiz routes
router.get('/quizzes', gamificationController_1.GamificationController.getQuizzes);
router.get('/quizzes/:id', gamificationController_1.GamificationController.getQuizById);
// Quiz attempt routes (students only)
router.post('/quiz-attempts', (0, auth_1.authorize)(types_1.UserRole.STUDENT), gamificationController_1.GamificationController.submitQuizAttempt);
router.get('/quiz-attempts/recent', (0, auth_1.authorize)(types_1.UserRole.STUDENT), gamificationController_1.GamificationController.getRecentAttempts);
// User profile and progress routes (students only)
router.get('/profile', (0, auth_1.authorize)(types_1.UserRole.STUDENT), gamificationController_1.GamificationController.getUserProfile);
router.get('/progress', (0, auth_1.authorize)(types_1.UserRole.STUDENT), gamificationController_1.GamificationController.getUserProgress);
// Badge routes
router.get('/badges', gamificationController_1.GamificationController.getAvailableBadges);
// Leaderboard route
router.get('/leaderboard', gamificationController_1.GamificationController.getLeaderboard);
exports.default = router;
//# sourceMappingURL=gamification.js.map