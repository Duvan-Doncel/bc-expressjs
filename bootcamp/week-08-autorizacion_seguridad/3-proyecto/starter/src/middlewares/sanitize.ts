// src/middlewares/sanitize.ts - express-mongo-sanitize compatible con Express 5
//
// El middleware mongoSanitize() de la libreria reasigna req.query, pero en Express 5
// req.query es un getter de solo lectura y cada request terminaria en 500
// ("Cannot set property query ... which has only a getter"). Por eso se usa la
// funcion sanitize() de la misma libreria y se redefine req.query con el resultado.
import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { logger } from '../config/logger.js';

export function sanitizeInputs(req: Request, _res: Response, next: NextFunction): void {
  const dirty =
    mongoSanitize.has(req.body as Record<string, unknown>) ||
    mongoSanitize.has(req.params as Record<string, unknown>) ||
    mongoSanitize.has(req.query as Record<string, unknown>);

  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize.sanitize(req.body as Record<string, unknown>);
  }
  req.params = mongoSanitize.sanitize(req.params);

  const query = mongoSanitize.sanitize({ ...req.query });
  Object.defineProperty(req, 'query', { value: query, writable: true, configurable: true, enumerable: true });

  // Se registra el intento: claves que empiezan con $ o tienen puntos (operadores de MongoDB)
  if (dirty) logger.warn(`NoSQL injection bloqueada: ${req.method} ${req.path} desde ${req.ip}`);
  next();
}
