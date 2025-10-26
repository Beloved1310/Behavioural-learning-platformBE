"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const upload_1 = require("../middleware/upload");
const user_1 = require("../validation/user");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get current user profile
router.get('/profile', userController_1.UserController.getProfile);
// Update current user profile
router.put('/profile', (0, middleware_1.validate)(user_1.updateProfileSchema), userController_1.UserController.updateProfile);
// Upload profile image
router.post('/profile/image', (0, upload_1.uploadSingle)('image'), userController_1.UserController.uploadProfileImage);
// Delete profile image
router.delete('/profile/image', userController_1.UserController.deleteProfileImage);
// Update password
router.put('/password', (0, middleware_1.validate)(user_1.updatePasswordSchema), userController_1.UserController.updatePassword);
// Delete account
router.delete('/account', (0, middleware_1.validate)(user_1.deleteAccountSchema), userController_1.UserController.deleteAccount);
exports.default = router;
//# sourceMappingURL=users.js.map