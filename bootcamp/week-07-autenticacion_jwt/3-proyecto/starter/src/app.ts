// src/app.ts - Configuracion de Express (orden: middlewares, rutas, notFound, errorHandler)
import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes';
import productsRouter from './routes/product.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

export const app: Express = express();

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de autenticacion (publicas: register, login, refresh)
app.use('/api/v1/auth', authRouter);

// Recurso principal del mercado campesino (todas las rutas protegidas)
app.use('/api/v1/products', productsRouter);

// Middlewares de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);
