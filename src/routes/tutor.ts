import { Router } from 'express';
import { TutorStudentsController } from '../controllers/tutorStudentsController';
import { TutorGoalsController } from '../controllers/tutorGoalsController';
import { TutorCommitmentsController } from '../controllers/tutorCommitmentsController';
import { TutorReflectionsController } from '../controllers/tutorReflectionsController';
import { TutorAssessmentsController } from '../controllers/tutorAssessmentsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import {
  inviteStudentSchema,
  createStudentSchema,
  assignGoalSchema,
  approveGoalSchema,
  rejectGoalSchema,
  assignCommitmentSchema,
  addReflectionFeedbackSchema,
  addAssessmentFeedbackSchema,
} from '../validation/tutor';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tutor student progress routes
router.get('/students/progress', TutorStudentsController.getAllStudentsProgress);
router.get('/students/at-risk', TutorStudentsController.getAtRiskStudents);
router.get('/students/search', TutorStudentsController.searchStudents);
router.get('/students/:studentId', TutorStudentsController.getStudentDetail);
router.post('/students/invite', validate(inviteStudentSchema), TutorStudentsController.inviteStudent);
router.post('/students/create', validate(createStudentSchema), TutorStudentsController.createStudent);

// Tutor goal assignment routes
router.get('/goals/assigned', TutorGoalsController.getAssignedGoals);
router.get('/goals/pending', TutorGoalsController.getPendingGoals);
router.post('/students/:studentId/goals', validate(assignGoalSchema), TutorGoalsController.assignGoal);
router.post('/goals/:goalId/approve', validate(approveGoalSchema), TutorGoalsController.approveGoal);
router.post('/goals/:goalId/reject', validate(rejectGoalSchema), TutorGoalsController.rejectGoal);

// Tutor commitment assignment routes
router.post(
  '/students/:studentId/commitments',
  validate(assignCommitmentSchema),
  TutorCommitmentsController.assignCommitment
);
router.get('/commitments/assigned', TutorCommitmentsController.getAssignedCommitments);

// Tutor reflection feedback routes
router.get('/students/:studentId/reflections', TutorReflectionsController.getStudentReflections);
router.get('/reflections/pending', TutorReflectionsController.getPendingFeedback);
router.post(
  '/reflections/:reflectionId/feedback',
  validate(addReflectionFeedbackSchema),
  TutorReflectionsController.addFeedback
);

// Tutor assessment feedback routes
router.get('/students/:studentId/assessments', TutorAssessmentsController.getStudentAssessments);
router.get('/assessments/pending', TutorAssessmentsController.getPendingFeedback);
router.post(
  '/assessments/:assessmentId/feedback',
  validate(addAssessmentFeedbackSchema),
  TutorAssessmentsController.addFeedback
);

export default router;
