import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { PreferencesController } from '../controllers/preferencesController';
import { authenticate } from '../middleware/auth';
import { validate } from '../validation/middleware';
import { uploadSingle } from '../middleware/upload';
import { updateProfileSchema, updatePasswordSchema, deleteAccountSchema } from '../validation/user';
import { updatePreferencesSchema } from '../validation/preferences';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user profile
router.get('/profile', UserController.getProfile);

// Update current user profile
router.put('/profile', validate(updateProfileSchema), UserController.updateProfile);

// Upload profile image
router.post('/profile/image', uploadSingle('image'), UserController.uploadProfileImage);

// Delete profile image
router.delete('/profile/image', UserController.deleteProfileImage);

// Update password
router.put('/password', validate(updatePasswordSchema), UserController.updatePassword);

// Delete account
router.delete('/account', validate(deleteAccountSchema), UserController.deleteAccount);

// Get children (parents only)
router.get('/children', UserController.getChildren);

// User preferences endpoints (alias for /v1/api/preferences)
router.get('/profile/preferences', PreferencesController.getPreferences);
router.put(
  '/profile/preferences',
  validate(updatePreferencesSchema),
  PreferencesController.updatePreferences
);

// Data export endpoints (GDPR compliance)
router.post('/export-data', UserController.requestDataExport);
router.get('/export-data/:exportId', UserController.downloadDataExport);

export default router;
