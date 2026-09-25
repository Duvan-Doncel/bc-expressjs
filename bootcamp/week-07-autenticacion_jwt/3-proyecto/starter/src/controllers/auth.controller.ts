import { Request, Response, NextFunction, CookieOptions } from 'express';
import * as authService from '../services/auth.service';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { AppError } from '../errors/AppError';

const REFRESH_COOKIE_PATH = '/api/v1/auth';

// secure por defecto; solo se desactiva con COOKIE_SECURE=false (p. ej. pruebas por http sin localhost)
function baseCookieOptions(path = '/'): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== 'false',
    sameSite: 'strict',
    path,
  };
}

function setTokenCookies(res: Response, tokens: authService.TokenCookieOptions): void {
  res.cookie('accessToken', tokens.accessToken, { ...baseCookieOptions(), maxAge: tokens.accessMaxAge });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...baseCookieOptions(REFRESH_COOKIE_PATH),
    maxAge: tokens.refreshMaxAge,
  });
}

function clearTokenCookies(res: Response): void {
  // clearCookie necesita las mismas opciones (path, secure, sameSite) con que se creo la cookie
  res.clearCookie('accessToken', baseCookieOptions());
  res.clearCookie('refreshToken', baseCookieOptions(REFRESH_COOKIE_PATH));
}

function toPublicUser(user: { _id: unknown; email: string; name: string; role: string }) {
  return { id: user._id, email: user.email, name: user.name, role: user.role };
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = registerSchema.parse(req.body);
    const user = await authService.register(dto);
    res.status(201).json({ data: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginSchema.parse(req.body);
    const tokens = await authService.login(dto);
    setTokenCookies(res, tokens);
    res.status(200).json({ message: 'Login exitoso' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.sub);
    res.status(200).json({ data: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const incomingToken = req.cookies?.refreshToken as string | undefined;
    if (!incomingToken) throw new AppError(401, 'Refresh token no encontrado');
    const tokens = await authService.refresh(incomingToken);
    setTokenCookies(res, tokens);
    res.status(200).json({ message: 'Tokens renovados' });
  } catch (err) {
    // Si el refresh falla, se limpian las cookies para forzar un nuevo login
    if (err instanceof AppError && err.statusCode === 401) clearTokenCookies(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logout(req.user!.sub);
    clearTokenCookies(res);
    res.status(200).json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
}
