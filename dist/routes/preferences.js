"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const preferencesController_1 = require("../controllers/preferencesController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const preferences_1 = require("../validation/preferences");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Get user preferences
router.get('/', preferencesController_1.PreferencesController.getPreferences);
// Update user preferences
router.put('/', (0, middleware_1.validate)(preferences_1.updatePreferencesSchema), preferencesController_1.PreferencesController.updatePreferences);
// Reset preferences to default
router.post('/reset', preferencesController_1.PreferencesController.resetPreferences);
exports.default = router;
//# sourceMappingURL=preferences.js.map