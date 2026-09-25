// src/controllers/item.controller.ts - Capa HTTP de Product (catalogo del mercado campesino)
// Los permisos se aplican en las rutas (authMiddleware / requireRole) y la propiedad en el servicio.
import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/item.service.js';
import { createProductSchema, updateProductSchema } from '../schemas/item.schema.js';
import { PRODUCT_CATEGORIES, type ProductCategory } from '../models/item.model.js';
import { parseId, parsePagination } from './params.js';

function parseCategory(value: unknown): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find((category) => category === value);
}

export async function getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, limit } = parsePagination(req.query);
    const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : '';
    const result = await productService.getProducts(page, limit, {
      search: search || undefined,
      category: parseCategory(req.query['category']),
      onlyAvailable: req.query['available'] === 'true',
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await productService.getProductById(parseId(req.params['id']));
    res.json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createProductSchema.parse(req.body);
    const product = await productService.createProduct(dto, req.user!.sub);
    res.status(201).json({ message: 'Producto creado', data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseId(req.params['id']);
    const dto = updateProductSchema.parse(req.body);
    const product = await productService.updateProduct(id, dto, req.user!);
    res.json({ message: 'Producto actualizado', data: product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await productService.deleteProduct(parseId(req.params['id']));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
