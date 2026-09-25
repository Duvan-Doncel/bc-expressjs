// src/routes/product.routes.ts - Endpoints de Product (/api/v1/products), todos protegidos
import { Router } from 'express';
import * as productController from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router: Router = Router();

// Todas las rutas de este router requieren autenticacion (cookie accessToken valida)
router.use(authMiddleware);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.patch('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;
