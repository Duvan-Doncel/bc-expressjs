import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
  getProductsHandler,
  getProductByIdHandler,
  createProductHandler,
  updateProductHandler,
  sellProductHandler,
  deleteProductHandler,
} from '../controllers/items.controller.js';

// ============================================================
// PRODUCTS ROUTER — /api/v1/products
// ============================================================

export const productsRouter: Router = Router();

// Publico: catalogo y precios del puesto
productsRouter.get('/', getProductsHandler);
productsRouter.get('/:id', getProductByIdHandler);

// Vendedor o admin autenticado (la propiedad se valida en el servicio)
productsRouter.post('/', authenticate, createProductHandler);
productsRouter.put('/:id', authenticate, updateProductHandler);
productsRouter.post('/:id/sell', authenticate, sellProductHandler);

// Solo admin: retirar un producto del catalogo
productsRouter.delete('/:id', authenticate, authorize('admin'), deleteProductHandler);
