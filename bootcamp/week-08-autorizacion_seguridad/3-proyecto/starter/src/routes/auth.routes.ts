import { Router } from 'express';
import { register, login, refresh, logout, me } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../config/security.js';

const router: Router = Router();

// Publicas, con rate limit estricto (5 req / 15 min) contra fuerza bruta
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Publica: usa la cookie refreshToken
router.post('/refresh', refresh);

// Protegidas
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, me);

export default router;
