// src/middlewares/errorHandler.ts - 4 parametros
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger';

interface ErrorBody {
  error: string;
  message: string;
  issues?: Array<{ field: string; message: string }>;
  stack?: string;
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // 1. ZodError -> 400
  if (err instanceof ZodError) {
    const body: ErrorBody = {
      error: 'Validation Error',
      message: 'Datos de entrada invalidos',
      issues: err.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    };
    logger.warn(`Validacion fallida: ${body.issues?.length ?? 0} issue(s)`);
    res.status(400).json(body);
    return;
  }

  // 2. AppError -> su statusCode
  if (err instanceof AppError) {
    const body: ErrorBody = { error: 'Application Error', message: err.message };
    logger.warn(`${err.statusCode} - ${err.message}`);
    res.status(err.statusCode).json(body);
    return;
  }

  // 3. Error generico -> 500 (stack solo fuera de produccion)
  const isProduction = process.env['NODE_ENV'] === 'production';
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error(`Error no controlado: ${error.message}`);

  const body: ErrorBody = {
    error: 'Internal Server Error',
    message: isProduction ? 'Error interno del servidor' : error.message,
  };
  if (!isProduction && error.stack) {
    body.stack = error.stack;
  }
  res.status(500).json(body);
}
