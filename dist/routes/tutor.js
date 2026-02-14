"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tutorStudentsController_1 = require("../controllers/tutorStudentsController");
const tutorGoalsController_1 = require("../controllers/tutorGoalsController");
const tutorCommitmentsController_1 = require("../controllers/tutorCommitmentsController");
const tutorReflectionsController_1 = require("../controllers/tutorReflectionsController");
const tutorAssessmentsController_1 = require("../controllers/tutorAssessmentsController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const tutor_1 = require("../validation/tutor");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Tutor student progress routes
router.get('/students/progress', tutorStudentsController_1.TutorStudentsController.getAllStudentsProgress);
router.get('/students/at-risk', tutorStudentsController_1.TutorStudentsController.getAtRiskStudents);
router.get('/students/search', tutorStudentsController_1.TutorStudentsController.searchStudents);
router.get('/students/:studentId', tutorStudentsController_1.TutorStudentsController.getStudentDetail);
router.post('/students/invite', (0, middleware_1.validate)(tutor_1.inviteStudentSchema), tutorStudentsController_1.TutorStudentsController.inviteStudent);
router.post('/students/create', (0, middleware_1.validate)(tutor_1.createStudentSchema), tutorStudentsController_1.TutorStudentsController.createStudent);
// Tutor goal assignment routes
router.get('/goals/assigned', tutorGoalsController_1.TutorGoalsController.getAssignedGoals);
router.get('/goals/pending', tutorGoalsController_1.TutorGoalsController.getPendingGoals);
router.post('/students/:studentId/goals', (0, middleware_1.validate)(tutor_1.assignGoalSchema), tutorGoalsController_1.TutorGoalsController.assignGoal);
router.post('/goals/:goalId/approve', (0, middleware_1.validate)(tutor_1.approveGoalSchema), tutorGoalsController_1.TutorGoalsController.approveGoal);
router.post('/goals/:goalId/reject', (0, middleware_1.validate)(tutor_1.rejectGoalSchema), tutorGoalsController_1.TutorGoalsController.rejectGoal);
// Tutor commitment assignment routes
router.post('/students/:studentId/commitments', (0, middleware_1.validate)(tutor_1.assignCommitmentSchema), tutorCommitmentsController_1.TutorCommitmentsController.assignCommitment);
router.get('/commitments/assigned', tutorCommitmentsController_1.TutorCommitmentsController.getAssignedCommitments);
// Tutor reflection feedback routes
router.get('/students/:studentId/reflections', tutorReflectionsController_1.TutorReflectionsController.getStudentReflections);
router.get('/reflections/pending', tutorReflectionsController_1.TutorReflectionsController.getPendingFeedback);
router.post('/reflections/:reflectionId/feedback', (0, middleware_1.validate)(tutor_1.addReflectionFeedbackSchema), tutorReflectionsController_1.TutorReflectionsController.addFeedback);
// Tutor assessment feedback routes
router.get('/students/:studentId/assessments', tutorAssessmentsController_1.TutorAssessmentsController.getStudentAssessments);
router.get('/assessments/pending', tutorAssessmentsController_1.TutorAssessmentsController.getPendingFeedback);
router.post('/assessments/:assessmentId/feedback', (0, middleware_1.validate)(tutor_1.addAssessmentFeedbackSchema), tutorAssessmentsController_1.TutorAssessmentsController.addFeedback);
exports.default = router;
//# sourceMappingURL=tutor.js.map