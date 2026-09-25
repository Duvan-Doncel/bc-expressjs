// src/middlewares/errorHandler.ts - 4 parametros. Nunca expone stack traces al cliente.
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../config/logger.js';

interface ErrorBody {
  error: string;
  message: string;
  issues?: Array<{ field: string; message: string }>;
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
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
    logger.warn(`${err.statusCode} - ${err.message}`);
    res.status(err.statusCode).json({ error: 'Application Error', message: err.message });
    return;
  }

  // 3. JSON mal formado (body-parser) -> 400
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Bad Request', message: 'JSON mal formado' });
    return;
  }

  // 4. Error inesperado -> 500 generico. El detalle y el stack solo van al log del servidor.
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error(`Error no controlado en ${req.method} ${req.path}: ${error.message}\n${error.stack ?? ''}`);
  res.status(500).json({ error: 'Internal Server Error', message: 'Error interno del servidor' });
}
