import { Request, Response, NextFunction, CookieOptions } from 'express';
import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import { AppError } from '../errors/AppError.js';

const REFRESH_COOKIE_PATH = '/api/v1/auth';

// secure por defecto; solo se desactiva con COOKIE_SECURE=false
function baseCookieOptions(path = '/'): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE !== 'false',
    sameSite: 'strict',
    path,
  };
}

function setTokenCookies(res: Response, tokens: authService.IssuedTokens): void {
  res.cookie('accessToken', tokens.accessToken, { ...baseCookieOptions(), maxAge: tokens.accessMaxAge });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...baseCookieOptions(REFRESH_COOKIE_PATH),
    maxAge: tokens.refreshMaxAge,
  });
}

function clearTokenCookies(res: Response): void {
  res.clearCookie('accessToken', baseCookieOptions());
  res.clearCookie('refreshToken', baseCookieOptions(REFRESH_COOKIE_PATH));
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = registerSchema.parse(req.body);
    const user = await authService.register(dto);
    res.status(201).json({ message: 'Usuario registrado', data: user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginSchema.parse(req.body);
    const tokens = await authService.login(dto);
    setTokenCookies(res, tokens);
    // Los tokens viajan SOLO en cookies HttpOnly, nunca en el body
    res.json({ message: 'Login exitoso', role: tokens.role });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) throw new AppError(401, 'Refresh token no encontrado');
    const tokens = await authService.refreshTokens(token);
    setTokenCookies(res, tokens);
    res.json({ message: 'Tokens renovados' });
  } catch (err) {
    if (err instanceof AppError && err.statusCode === 401) clearTokenCookies(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await authService.logout(req.user!.sub);
    clearTokenCookies(res);
    res.json({ message: 'Sesión cerrada' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.sub);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}
