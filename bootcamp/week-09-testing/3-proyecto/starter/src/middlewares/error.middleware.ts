import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, `Ruta ${req.method} ${req.path} no encontrada`));
}

// Agrupa los mensajes por campo, sin el prefijo del envoltorio ({ body } / { params } / { query })
function fieldDetails(err: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const [location, ...path] = issue.path.map(String);
    const field = path.join('.') || location || 'body';
    (details[field] ??= []).push(issue.message);
  }
  return details;
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Zod -> 422 Unprocessable Entity con el detalle por campo
  if (err instanceof ZodError) {
    res.status(422).json({ error: 'Datos de entrada invalidos', details: fieldDetails(err) });
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  // Red de seguridad para errores de Mongo que no pasaron por el servicio
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: 'ID invalido' });
    return;
  }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === 11000) {
    res.status(409).json({ error: 'Registro duplicado' });
    return;
  }
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'JSON mal formado' });
    return;
  }
  if (process.env['NODE_ENV'] !== 'test') console.error(err);
  // Nunca se expone el stack ni el mensaje interno
  res.status(500).json({ error: 'Error interno del servidor' });
};
