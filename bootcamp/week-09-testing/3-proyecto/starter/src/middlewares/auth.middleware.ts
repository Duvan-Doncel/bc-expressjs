import type { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import type { TokenPayload, UserRole } from '../types/index.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Autenticacion requerida'));
  }
  try {
    res.locals['user'] = verifyAccessToken(authHeader.slice(7));
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) return next(new AppError(401, 'Token expirado'));
    next(new AppError(401, 'Token invalido'));
  }
}

// Siempre DESPUES de authenticate (necesita res.locals.user)
export function authorize(...roles: UserRole[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals['user'] as TokenPayload | undefined;
    if (!user) return next(new AppError(401, 'Autenticacion requerida'));
    if (!roles.includes(user.role)) {
      return next(new AppError(403, `Permisos insuficientes: se requiere rol ${roles.join(', ')}`));
    }
    next();
  };
}
