"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commitmentsController_1 = require("../controllers/commitmentsController");
const auth_1 = require("../middleware/auth");
const middleware_1 = require("../validation/middleware");
const commitments_1 = require("../validation/commitments");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// Commitments routes
router.get('/current', commitmentsController_1.CommitmentsController.getCurrentCommitments);
router.post('/weekly', (0, middleware_1.validate)(commitments_1.createCommitmentsSchema), commitmentsController_1.CommitmentsController.createCommitments);
router.patch('/:commitmentId/complete/:itemIndex', (0, middleware_1.validate)(commitments_1.toggleCommitmentSchema), commitmentsController_1.CommitmentsController.toggleCommitment);
router.get('/history', commitmentsController_1.CommitmentsController.getHistory);
router.delete('/:commitmentId', (0, middleware_1.validate)(commitments_1.deleteCommitmentSchema), commitmentsController_1.CommitmentsController.deleteCommitment);
exports.default = router;
//# sourceMappingURL=commitments.js.map