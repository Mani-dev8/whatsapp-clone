import { AppError } from '@/util/errorTypes';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { env } from '../config/env';
import { Error as MongooseError } from 'mongoose';
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Handle Mongoose validation errors
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((val) => val.message);
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: 'Validation Error',
      errors,
    });
    return;
  }

  // Handle Mongoose cast errors (invalid IDs, etc.)
  if (err instanceof MongooseError.CastError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: 'error',
      message: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // Handle Mongoose duplicate key errors (unique constraint violations)
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    res.status(StatusCodes.CONFLICT).json({
      status: 'error',
      message: `Duplicate value for ${field}. This ${field} is already in use.`,
    });
    return;
  }

  console.error(err);

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message:
      env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
};
