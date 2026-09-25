import express, { type Express } from 'express';
import helmet from 'helmet';
import { authRouter } from './routes/auth.routes.js';
import { productsRouter } from './routes/items.routes.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';

// ============================================================
// app.ts — configuración de Express SIN app.listen()
// ============================================================
// Importar { app } en los tests — NUNCA server.ts
// ============================================================

export const app: Express = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
