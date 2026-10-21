import type { NextFunction, Request, Response } from 'express';
import { ZodType } from 'zod';

const body = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsedData = schema.safeParse(req.body);

    if (!parsedData.success) {
      next(parsedData.error);
      return;
    }
    req.validatedBody = parsedData.data;
    next();
  };
};

const params = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsedData = schema.safeParse(req.params);

    if (!parsedData.success) {
      next(parsedData.error);
      return;
    }
    req.validatedParams = parsedData.data;
    next();
  };
};

const query = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsedData = schema.safeParse(req.query);

    if (!parsedData.success) {
      next(parsedData.error);
      return;
    }
    req.validatedQuery = parsedData.data;
    next();
  };
};

export const Validator = { body, params, query };
export { body, params, query };
