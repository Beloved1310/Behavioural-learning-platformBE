import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../shared/errors/AppError';

export interface ValidationSchema {
  body?: Joi.AnySchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

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
      
      return next(
        AppError.validation(errorMessage, 'VALIDATION_ERROR', { 
          details: errors,
          fields: errors.map(err => {
            // Try to extract field name from error message
            const match = err.match(/^"([^"]+)"\s/);
            return match ? match[1] : null;
          }).filter(Boolean)
        })
      );
    }

    next();
  };
};

// Middleware to validate MongoDB ObjectId
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(AppError.badRequest(`Invalid ${paramName} format`, 'INVALID_ID_FORMAT'));
    }

    next();
  };
};

// Common validation options
export const commonOptions = {
  abortEarly: false,
  stripUnknown: true,
  errors: {
    wrap: {
      label: '',
    },
  },
};
