"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonOptions = exports.validateObjectId = exports.validate = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        // Validate route parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params, {
                abortEarly: false,
                stripUnknown: true
            });
            if (error) {
                errors.push(...error.details.map(detail => detail.message));
            }
        }
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors
            });
        }
        next();
    };
};
exports.validate = validate;
// Middleware to validate MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
    return (req, res, next) => {
        const id = req.params[paramName];
        if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
            return next(new errorHandler_1.AppError(`Invalid ${paramName} format`, 400));
        }
        next();
    };
};
exports.validateObjectId = validateObjectId;
// Common validation options
exports.commonOptions = {
    abortEarly: false,
    stripUnknown: true,
    errors: {
        wrap: {
            label: ''
        }
    }
};
//# sourceMappingURL=middleware.js.map