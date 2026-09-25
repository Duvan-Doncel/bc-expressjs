import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validators/auth.schema.js';
import type { TokenPayload } from '../types/index.js';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = registerSchema.parse({ body: req.body });
    const user = await authService.register(body);
    res.status(201).json({ data: user });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const result = await authService.login(body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function meHandler(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = res.locals['user'] as TokenPayload;
    const data = await authService.getMe(user.sub);
    res.status(200).json({ data });
  } catch (err) {
    next(err);
  }
}
