"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonOptions = exports.validateObjectId = exports.validate = void 0;
const AppError_1 = require("../shared/errors/AppError");
const validate = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate request body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                errors.push(...error.details.map((detail) => detail.message));
            }
        }
        // Validate query parameters
        if (schema.query) {
            const { error } = schema.query.validate(req.query, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                errors.push(...error.details.map((detail) => detail.message));
            }
        }
        // Validate route parameters
        if (schema.params) {
            const { error } = schema.params.validate(req.params, {
                abortEarly: false,
                stripUnknown: true,
            });
            if (error) {
                errors.push(...error.details.map((detail) => detail.message));
            }
        }
        if (errors.length > 0) {
            // Create a more detailed error message
            const errorMessage = errors.length === 1
                ? errors[0]
                : `Validation failed: ${errors.join('; ')}`;
            return next(AppError_1.AppError.validation(errorMessage, 'VALIDATION_ERROR', {
                details: errors,
                fields: errors.map(err => {
                    // Try to extract field name from error message
                    const match = err.match(/^"([^"]+)"\s/);
                    return match ? match[1] : null;
                }).filter(Boolean)
            }));
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
            return next(AppError_1.AppError.badRequest(`Invalid ${paramName} format`, 'INVALID_ID_FORMAT'));
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
            label: '',
        },
    },
};
//# sourceMappingURL=middleware.js.map