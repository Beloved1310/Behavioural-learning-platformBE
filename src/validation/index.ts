// Export all validation schemas for easy importing
export * as authValidation from './auth';
export * as userValidation from './user';
export * as sessionValidation from './session';
export * as chatValidation from './chat';
export * as quizValidation from './quiz';
export * as gamificationValidation from './gamification';
export * as paymentValidation from './payment';
export * as analyticsValidation from './analytics';

// Export middleware and common utilities
export { validate, validateObjectId, commonOptions } from './middleware';
export { commonFields, paginationSchema, idParamSchema } from './common';