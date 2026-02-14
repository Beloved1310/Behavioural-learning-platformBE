"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sessionsController_1 = require("../controllers/sessionsController");
const tutorAvailabilityController_1 = require("../controllers/tutorAvailabilityController");
const tutorSessionController_1 = require("../controllers/tutorSessionController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const session_1 = require("../validation/session");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Session management routes
router.get('/sessions', (0, middleware_1.validate)(session_1.getSessionsSchema), sessionsController_1.SessionsController.getUserSessions);
router.get('/sessions/stats', sessionsController_1.SessionsController.getSessionStats);
router.get('/sessions/:id', (0, middleware_1.validate)(session_1.getSessionByIdSchema), sessionsController_1.SessionsController.getSessionById);
router.post('/sessions', (0, middleware_1.validate)(session_1.createSessionSchema), sessionsController_1.SessionsController.createSession);
router.put('/sessions/:id', (0, middleware_1.validate)(session_1.updateSessionSchema), sessionsController_1.SessionsController.updateSession);
router.delete('/sessions/:id', (0, middleware_1.validate)(session_1.getSessionByIdSchema), sessionsController_1.SessionsController.deleteSession);
router.patch('/sessions/:id/status', (0, middleware_1.validate)(session_1.updateSessionStatusSchema), sessionsController_1.SessionsController.updateSessionStatus);
// Tutor-related routes (for students to search and book tutors)
router.get('/sessions/tutors/search', sessionsController_1.SessionsController.searchTutors);
router.get('/sessions/tutors/:tutorId/availability', (0, middleware_1.validate)(session_1.getAvailabilitySchema), sessionsController_1.SessionsController.getTutorAvailability);
router.post('/sessions/tutors/book', (0, middleware_1.validate)(session_1.bookTutorSessionSchema), sessionsController_1.SessionsController.bookTutorSession);
// Tutor availability management (for tutors to set their calendar)
router.get('/tutor/availability', tutorAvailabilityController_1.TutorAvailabilityController.getAvailability);
router.post('/tutor/availability', (0, middleware_1.validate)(session_1.setAvailabilitySchema), tutorAvailabilityController_1.TutorAvailabilityController.setAvailability);
router.post('/tutor/availability/add', (0, middleware_1.validate)(session_1.addAvailabilitySchema), tutorAvailabilityController_1.TutorAvailabilityController.addAvailability);
router.delete('/tutor/availability/:id', (0, middleware_1.validate)(session_1.deleteAvailabilitySchema), tutorAvailabilityController_1.TutorAvailabilityController.deleteAvailability);
// Teacher-centric session management
router.get('/tutor/requests', tutorSessionController_1.TutorSessionController.getPendingRequests);
router.post('/tutor/requests/:id/approve', (0, middleware_1.validate)(session_1.getSessionByIdSchema), tutorSessionController_1.TutorSessionController.approveRequest);
router.post('/tutor/requests/:id/reject', (0, middleware_1.validate)(session_1.getSessionByIdSchema), tutorSessionController_1.TutorSessionController.rejectRequest);
router.post('/tutor/sessions/create', (0, middleware_1.validate)(session_1.tutorCreateSessionSchema), tutorSessionController_1.TutorSessionController.createSession);
router.post('/tutor/sessions/:id/reschedule', (0, middleware_1.validate)(session_1.tutorRescheduleSessionSchema), tutorSessionController_1.TutorSessionController.rescheduleSession);
router.post('/tutor/sessions/:id/cancel', (0, middleware_1.validate)(session_1.getSessionByIdSchema), tutorSessionController_1.TutorSessionController.cancelSession);
exports.default = router;
//# sourceMappingURL=sessions.js.map