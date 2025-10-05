import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
}
export declare const validate: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateObjectId: (paramName?: string) => (req: Request, res: Response, next: NextFunction) => void;
export declare const commonOptions: {
    abortEarly: boolean;
    stripUnknown: boolean;
    errors: {
        wrap: {
            label: string;
        };
    };
};
//# sourceMappingURL=middleware.d.ts.map