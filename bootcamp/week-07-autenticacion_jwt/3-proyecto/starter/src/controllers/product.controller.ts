// src/controllers/product.controller.ts - Capa HTTP de Product (todas las rutas requieren login)
import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../models/product.model';
import { parseId, parsePagination } from './params';

function parseCategory(value: unknown): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((category) => category === value);
}

export async function getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : '';
    const result = await productService.getAll(page, limit, {
      search: search || undefined,
      category: parseCategory(req.query['category']),
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getById(parseId(req.params['id']));
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createProductSchema.parse(req.body);
    const product = await productService.create(dto, req.user!.sub);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params['id']);
    const dto = updateProductSchema.parse(req.body);
    const product = await productService.update(id, dto);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.remove(parseId(req.params['id']));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
