import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { UserRole } from '../models/user.model.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole; // requireRole lee el rol directamente del payload
}

// Duracion de los tokens (la cookie dura lo mismo que su token)
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutos
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function getSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not defined`);
  return secret;
}

// Se valida al arrancar: los dos secretos existen, son largos y son DISTINTOS
export function assertJwtConfig(): void {
  const access = getSecret('JWT_ACCESS_SECRET');
  const refresh = getSecret('JWT_REFRESH_SECRET');
  if (access === refresh) throw new Error('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
  if (access.length < 32 || refresh.length < 32) {
    throw new Error('Los secretos JWT deben tener al menos 32 caracteres');
  }
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), {
    algorithm: 'HS256',
    expiresIn: ACCESS_TOKEN_MAX_AGE_MS / 1000,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  // jwt.verify valida la firma Y la expiracion
  return jwt.verify(token, getSecret('JWT_ACCESS_SECRET'), { algorithms: ['HS256'] }) as JwtPayload;
}

export function signRefreshToken(userId: string): string {
  // jwtid aleatorio: dos refresh emitidos en el mismo segundo nunca son iguales
  return jwt.sign({ sub: userId }, getSecret('JWT_REFRESH_SECRET'), {
    algorithm: 'HS256',
    expiresIn: REFRESH_TOKEN_MAX_AGE_MS / 1000,
    jwtid: randomUUID(),
  });
}

export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, getSecret('JWT_REFRESH_SECRET'), { algorithms: ['HS256'] }) as { sub: string };
}
