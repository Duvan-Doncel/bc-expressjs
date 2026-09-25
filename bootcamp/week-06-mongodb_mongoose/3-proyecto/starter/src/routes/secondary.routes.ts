// src/routes/secondary.routes.ts - Endpoints del recurso Category (/api/v1/categories)
import { Router } from 'express';
import * as ctrl from '../controllers/secondary.controller';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
