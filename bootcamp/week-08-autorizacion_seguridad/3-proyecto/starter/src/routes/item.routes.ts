// src/routes/item.routes.ts - Catalogo de productos del mercado campesino (/api/v1/products)
import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/item.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router: Router = Router();

// Publico: cualquier comprador puede ver el catalogo y los precios sin tener cuenta
router.get('/', getProducts);
router.get('/:id', getProductById);

// Autenticado (vendedor o admin): registrar un producto
router.post('/', authMiddleware, createProduct);

// Autenticado + dueño O admin (la propiedad se verifica en el servicio)
router.patch('/:id', authMiddleware, updateProduct);

// Solo admin: retirar un producto del catalogo
router.delete('/:id', authMiddleware, requireRole('admin'), deleteProduct);

export default router;
