import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service.js';
import { updateRoleSchema } from '../schemas/auth.schema.js';
import { parseId } from './params.js';

// GET /api/v1/users/dashboard — cualquier usuario autenticado (vendedor o admin)
export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({
      message: 'Bienvenido al panel del mercado campesino',
      data: { userId: req.user!.sub, email: req.user!.email, role: req.user!.role },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/users — solo admin
export async function listUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await userService.listUsers();
    res.json({ data: users, total: users.length });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/users/:id/role — solo admin
export async function changeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = updateRoleSchema.parse(req.body);
    const user = await userService.changeRole(parseId(req.params['id']), role, req.user!.sub);
    res.json({ message: 'Rol actualizado', data: user });
  } catch (err) {
    next(err);
  }
}
