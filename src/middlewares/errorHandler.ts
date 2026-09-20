import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../utils/apiResponse';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return ApiResponse.error(res, 'Validation failed', 400, formattedErrors);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiResponse.error(res, `${field} already exists.`, 400);
  }

  // Handle Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Invalid resource ID: ${err.value}`, 400);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  return ApiResponse.error(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return ApiResponse.error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
