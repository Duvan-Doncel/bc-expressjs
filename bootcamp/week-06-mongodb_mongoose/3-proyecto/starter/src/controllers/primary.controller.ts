// src/controllers/primary.controller.ts - Capa HTTP de Product (delgada)
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/primary.service';
import { createPrimarySchema, updatePrimarySchema } from '../schemas/primary.schema';
import { parseId, parsePagination } from './params';

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : undefined;
    const result = await service.getAll(page, limit, search || undefined);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await service.getById(parseId(req.params['id']));
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createPrimarySchema.parse(req.body);
    const product = await service.createPrimary(dto);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params['id']);
    const dto = updatePrimarySchema.parse(req.body);
    const product = await service.updatePrimary(id, dto);
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deletePrimary(parseId(req.params['id']));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
