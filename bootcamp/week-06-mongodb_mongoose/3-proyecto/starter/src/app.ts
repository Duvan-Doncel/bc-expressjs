// src/app.ts - Configuracion de Express (orden: middlewares, rutas, notFound, errorHandler)
import express from 'express';
import categoriesRouter from './routes/secondary.routes';
import productsRouter from './routes/primary.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/products', productsRouter);

app.use(notFound);
app.use(errorHandler);
