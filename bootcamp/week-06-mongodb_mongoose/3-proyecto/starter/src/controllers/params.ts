// src/controllers/params.ts - Helpers compartidos para leer params y query
import { Request } from 'express';
import { objectIdSchema } from '../schemas/primary.schema';
import { AppError } from '../errors/AppError';

export function parseId(value: unknown): string {
  const parsed = objectIdSchema.safeParse(value);
  if (!parsed.success) throw new AppError(400, 'ID invalido');
  return parsed.data;
}

export function parsePagination(query: Request['query']): { page: number; limit: number } {
  const page = Math.max(1, Math.trunc(Number(query['page'])) || 1);
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(query['limit'])) || 10));
  return { page, limit };
}
