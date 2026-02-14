// Export all validation schemas for easy importing
export * as authValidation from './auth';
export * as userValidation from './user';
export * as sessionValidation from './session';
export * as chatValidation from './chat';
export * as quizValidation from './quiz';
export * as gamificationValidation from './gamification';
export * as goalsValidation from './goals';
export * as commitmentsValidation from './commitments';
export * as reflectionsValidation from './reflections';
export * as assessmentsValidation from './assessments';
export * as milestonesValidation from './milestones';
export * as tutorValidation from './tutor';
export * as adminValidation from './admin';
export * as parentReportsValidation from './parentReports';
// export * as paymentValidation from './payment'; // Removed from MVP
export * as analyticsValidation from './analytics';

// Export middleware and common utilities
export { validate, validateObjectId, commonOptions } from './middleware';
export { commonFields, paginationSchema, idParamSchema } from './common';
