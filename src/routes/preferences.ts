import { Router } from 'express';
import { PreferencesController } from '../controllers/preferencesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import { updatePreferencesSchema } from '../validation/preferences';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user preferences
router.get('/', PreferencesController.getPreferences);

// Update user preferences
router.put('/', validate(updatePreferencesSchema), PreferencesController.updatePreferences);

// Reset preferences to default
router.post('/reset', PreferencesController.resetPreferences);

export default router;
