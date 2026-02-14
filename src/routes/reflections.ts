import { Router } from 'express';
import { ReflectionsController } from '../controllers/reflectionsController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import { createReflectionSchema, getReflectionsSchema } from '../validation/reflections';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Reflections routes
router.get('/', validate(getReflectionsSchema), ReflectionsController.getReflections);
router.post('/', validate(createReflectionSchema), ReflectionsController.createReflection);
router.get('/insights', ReflectionsController.getInsights);
router.get('/prompts/today', ReflectionsController.getTodayPrompt);

export default router;
