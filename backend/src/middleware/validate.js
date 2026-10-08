import { ZodError } from 'zod';
import { AppError } from '../utils/appError.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed; // assign sanitized/parsed data
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues || error.errors || [];
        const formattedErrors = issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));

        const primaryMessage = formattedErrors.length > 0
          ? `${formattedErrors[0].field || 'request'}: ${formattedErrors[0].message}`
          : 'Validation failed';

        return next(new AppError(primaryMessage, 400, 'VALIDATION_ERROR', formattedErrors));
      }
      next(error);
    }
  };
};
