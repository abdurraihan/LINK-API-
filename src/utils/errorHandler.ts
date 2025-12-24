import { Request, Response, NextFunction } from 'express';

// Custom Error Interface (Optional, for better typing)
interface IError extends Error {
  statusCode?: number;
  status?: string;
}

// Global Error Handler
export const globalErrorHandler = (
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong!',
  });
};
