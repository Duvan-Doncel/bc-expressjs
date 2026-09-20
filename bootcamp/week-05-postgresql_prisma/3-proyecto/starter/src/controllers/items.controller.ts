// src/controllers/items.controller.ts - Capa HTTP (delgada)
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as service from '../services/items.service';
import { createItemSchema, updateItemSchema } from '../schemas/items.schema';

const idSchema = z.coerce.number().int().positive({
  message: 'El id debe ser un numero entero positivo',
});

function formatIssues(error: z.ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'id',
    message: issue.message,
  }));
}

function parsePagination(query: Request['query']): { page: number; limit: number } {
  const page = Math.max(1, Math.trunc(Number(query['page'])) || 1);
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(query['limit'])) || 10));
  return { page, limit };
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const result = await service.listItems(page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = idSchema.safeParse(req.params['id']);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Parametro invalido',
        issues: formatIssues(parsed.error),
      });
      return;
    }
    const item = await service.getItem(parsed.data);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = createItemSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Datos de entrada invalidos',
        issues: formatIssues(result.error),
      });
      return;
    }
    const item = await service.createItem(result.data);
    res.status(201).json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsedId = idSchema.safeParse(req.params['id']);
    if (!parsedId.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Parametro invalido',
        issues: formatIssues(parsedId.error),
      });
      return;
    }
    const result = updateItemSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Datos de entrada invalidos',
        issues: formatIssues(result.error),
      });
      return;
    }
    const item = await service.updateItem(parsedId.data, result.data);
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = idSchema.safeParse(req.params['id']);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Parametro invalido',
        issues: formatIssues(parsed.error),
      });
      return;
    }
    await service.deleteItem(parsed.data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}