import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../errors/AppError';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.accessToken as string | undefined;

  if (!token) {
    return next(new AppError(401, 'No autenticado — token no encontrado'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    // Token con firma valida pero vencido -> 401 para que el cliente llame a /auth/refresh
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Token expirado — usa /api/v1/auth/refresh'));
    }
    next(new AppError(401, 'Token inválido'));
  }
}
