import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zod v4 uses .issues instead of .errors
        const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
        return res(_res, messages);
      }
      next(error);
    }
  };
}

function res(response: Response, messages: string[]) {
  return response.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: messages,
  });
}
