import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '../middleware/errorHandler';

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
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

// Middleware to validate MongoDB ObjectId
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
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
      label: ''
    }
  }
};