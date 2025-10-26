"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionsController_1 = require("../controllers/sessionsController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Session management routes
router.get('/sessions', sessionsController_1.SessionsController.getUserSessions);
router.get('/sessions/stats', sessionsController_1.SessionsController.getSessionStats);
router.get('/sessions/:id', sessionsController_1.SessionsController.getSessionById);
router.post('/sessions', sessionsController_1.SessionsController.createSession);
router.put('/sessions/:id', sessionsController_1.SessionsController.updateSession);
router.delete('/sessions/:id', sessionsController_1.SessionsController.deleteSession);
router.patch('/sessions/:id/status', sessionsController_1.SessionsController.updateSessionStatus);
// Tutor-related routes
router.get('/tutors/search', sessionsController_1.SessionsController.searchTutors);
router.get('/tutors/:tutorId/availability', sessionsController_1.SessionsController.getTutorAvailability);
router.post('/tutors/book', sessionsController_1.SessionsController.bookTutorSession);
exports.default = router;
//# sourceMappingURL=sessions.js.map