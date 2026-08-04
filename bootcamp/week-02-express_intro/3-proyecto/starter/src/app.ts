import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import { productsRouter } from './routes/items.routes.js';

export function createApp(): Application {
  const app = express();

  // 1. Parseo de body
  app.use(express.json());

  // 2. Logger personalizado
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // 3. Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // 4. Rutas del recurso principal
  app.use('/api/v1/products', productsRouter);

  // 5. Handler 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // 6. Error handler global — siempre el último
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}