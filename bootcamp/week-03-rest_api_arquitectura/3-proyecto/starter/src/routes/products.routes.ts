// ============================================
// ROUTES — Mapeo de URLs a controllers
// ============================================
// Las rutas solo conectan: URL + Método HTTP → función del controller
import { Router } from 'express';
import * as controller from '../controllers/products.controller';

export const productsRouter = Router();

productsRouter.get('/', controller.getAll);
productsRouter.get('/:id', controller.getById);
productsRouter.post('/', controller.create);
productsRouter.put('/:id', controller.update);
productsRouter.delete('/:id', controller.remove);
