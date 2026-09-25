import { Router } from 'express';
import { getDashboard, listUsers, changeRole } from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/requireRole.js';

const router: Router = Router();

// Todas las rutas de usuarios requieren sesion
router.use(authMiddleware);

// Vendedor o admin
router.get('/dashboard', requireRole('user', 'admin'), getDashboard);

// Solo admin: gestion de usuarios del mercado
router.get('/', requireRole('admin'), listUsers);
router.patch('/:id/role', requireRole('admin'), changeRole);

export default router;
