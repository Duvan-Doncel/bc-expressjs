// src/config/security.ts - Rate limiters y CORS con whitelist
import rateLimit from 'express-rate-limit';
import { CorsOptions } from 'cors';
import { AppError } from '../errors/AppError.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Global limiter — toda la API: 100 req / 15 min por IP
export const globalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 100,
  standardHeaders: 'draft-6', // RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Demasiadas solicitudes, intenta de nuevo en unos minutos' },
});

// Auth limiter — solo login/register: 5 req / 15 min (proteccion contra fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  message: { error: 'Too Many Requests', message: 'Demasiados intentos de autenticacion, espera 15 minutos' },
});

// CORS whitelist: se lee de CORS_ORIGINS (separados por coma). Nunca '*'.
// Por defecto: el frontend del mercado en desarrollo (Vite) y un segundo puerto local.
function allowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:3001';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Sin header Origin = no es un navegador (curl, Postman, server-to-server)
    if (!origin || allowedOrigins().includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError(403, `CORS: el origen ${origin} no esta permitido`));
    }
  },
  credentials: true, // necesario para enviar las cookies de sesion
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
};
