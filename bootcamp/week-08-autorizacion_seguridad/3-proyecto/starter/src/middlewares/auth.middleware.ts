import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken } from '../utils/jwt.js';
import { AppError } from '../errors/AppError.js';

// El access token viaja en la cookie HttpOnly 'accessToken' (igual que en la semana 07).
// Como alternativa para clientes que no son navegador, tambien se acepta Authorization: Bearer.
function extractToken(req: Request): string | undefined {
  const cookieToken = req.cookies?.accessToken as string | undefined;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice('Bearer '.length).trim() || undefined;
  return undefined;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    return next(new AppError(401, 'No autenticado — token no encontrado'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'Token expirado — usa /api/v1/auth/refresh'));
    }
    next(new AppError(401, 'Token inválido'));
  }
}
