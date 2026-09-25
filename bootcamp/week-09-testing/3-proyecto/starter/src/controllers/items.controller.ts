import type { Request, Response, NextFunction } from 'express';
import * as productsService from '../services/items.service.js';
import {
  createProductSchema,
  updateProductSchema,
  sellProductSchema,
  productIdSchema,
  productQuerySchema,
} from '../validators/items.schema.js';
import type { TokenPayload } from '../types/index.js';

function currentUser(res: Response): TokenPayload {
  return res.locals['user'] as TokenPayload;
}

export async function getProductsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { query } = productQuerySchema.parse({ query: req.query });
    const result = await productsService.getAll(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProductByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { params } = productIdSchema.parse({ params: req.params });
    const product = await productsService.getById(params.id);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = createProductSchema.parse({ body: req.body });
    const product = await productsService.create(body, currentUser(res).sub);
    res.status(201).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { params } = productIdSchema.parse({ params: req.params });
    const { body } = updateProductSchema.parse({ body: req.body });
    const user = currentUser(res);
    const product = await productsService.update(params.id, body, user.sub, user.role);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function sellProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { params } = productIdSchema.parse({ params: req.params });
    const { body } = sellProductSchema.parse({ body: req.body });
    const product = await productsService.sell(params.id, body.quantity);
    res.status(200).json({ data: product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { params } = productIdSchema.parse({ params: req.params });
    await productsService.remove(params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
