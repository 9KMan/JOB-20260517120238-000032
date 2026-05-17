import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, z } from 'zod';

export function validate<T extends ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
      const parsed = schema.parse(data);
      if (source === 'body') {
        req.body = parsed;
      } else if (source === 'query') {
        (req as Request & { validatedQuery: z.infer<T> }).validatedQuery = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof Error) {
        next(new Error(`Validation failed: ${err.message}`));
      } else {
        next(new Error('Validation failed'));
      }
    }
  };
}