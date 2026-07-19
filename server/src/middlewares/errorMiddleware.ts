import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  console.error(`[Error] ${req.method} ${req.url}:`, err);
  
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Có lỗi hệ thống xảy ra',
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack || err
  });
};
