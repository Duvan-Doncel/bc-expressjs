import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppError } from '../errors/AppError.js';
import type { UserRole } from '../models/user.model.js';

// requireRole es una funcion de orden superior que devuelve un RequestHandler.
// Compara req.user.role (viene en el payload del JWT) con los roles permitidos.
// SIEMPRE va DESPUES de authMiddleware (necesita req.user).
export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'Autenticación requerida'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, `Acceso denegado. Rol requerido: ${roles.join(', ')}`));
    }

    next();
  };
}
