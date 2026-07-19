import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body || {},
        query: req.query || {},
        params: req.params || {},
      });
      next();
    } catch (error: any) {
      if (error && (error instanceof ZodError || error.name === 'ZodError')) {
        const issues = error.issues || error.errors || [];
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          error: issues.map((e: any) => ({ field: e.path.join('.'), message: e.message }))
        });
      }
      next(error);
    }
  };
};
