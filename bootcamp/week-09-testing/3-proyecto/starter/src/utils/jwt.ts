import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { TokenPayload } from '../types/index.js';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): TokenPayload {
  // Valida firma y expiracion; solo se acepta HS256
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
}
