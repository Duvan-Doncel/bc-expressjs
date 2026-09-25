// src/controllers/secondary.controller.ts - Capa HTTP de Category (delgada)
import { Request, Response, NextFunction } from 'express';
import * as service from '../services/secondary.service';
import { createSecondarySchema, updateSecondarySchema } from '../schemas/secondary.schema';
import { parseId } from './params';

export async function getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await service.getAll();
    res.json({ data: categories });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = await service.getById(parseId(req.params['id']));
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createSecondarySchema.parse(req.body);
    const category = await service.createSecondary(dto);
    res.status(201).json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params['id']);
    const dto = updateSecondarySchema.parse(req.body);
    const category = await service.updateSecondary(id, dto);
    res.json({ data: category });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await service.deleteSecondary(parseId(req.params['id']));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
