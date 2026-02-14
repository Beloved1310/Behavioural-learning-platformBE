"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const middleware_1 = require("../validation/middleware");
const admin_1 = require("../validation/admin");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.authenticate);
router.use((0, auth_1.authorize)(types_1.UserRole.ADMIN));
// Dashboard stats
router.get('/dashboard/stats', adminController_1.AdminController.getDashboardStats);
// Tutor management
router.get('/tutors/pending', (0, middleware_1.validate)(admin_1.getPendingTutorsSchema), adminController_1.AdminController.getPendingTutors);
router.get('/tutors/:tutorId', (0, middleware_1.validate)(admin_1.getTutorByIdSchema), adminController_1.AdminController.getTutorById);
router.post('/tutors/:tutorId/approve', (0, middleware_1.validate)(admin_1.approveTutorSchema), adminController_1.AdminController.approveTutor);
router.post('/tutors/:tutorId/reject', (0, middleware_1.validate)(admin_1.rejectTutorSchema), adminController_1.AdminController.rejectTutor);
router.patch('/tutors/:tutorId/background-check', (0, middleware_1.validate)(admin_1.setBackgroundCheckStatusSchema), adminController_1.AdminController.setBackgroundCheckStatus);
// User management
router.get('/users', adminController_1.AdminController.getAllUsers);
router.get('/users/:userId', (0, middleware_1.validate)(admin_1.getUserByIdSchema), adminController_1.AdminController.getUserById);
router.patch('/users/:userId/status', (0, middleware_1.validate)(admin_1.updateUserStatusSchema), adminController_1.AdminController.updateUserStatus);
exports.default = router;
//# sourceMappingURL=admin.js.map