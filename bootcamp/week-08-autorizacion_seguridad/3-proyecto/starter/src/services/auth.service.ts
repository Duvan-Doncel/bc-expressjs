import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import {
  createUser,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById,
  findUserByIdWithRefresh,
  updateRefreshToken,
} from '../repositories/users.repository.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from '../utils/jwt.js';
import type { RegisterDto, LoginDto } from '../schemas/auth.schema.js';
import type { IUser, UserRole } from '../models/user.model.js';

const SALT_ROUNDS = 12;
const INVALID_CREDENTIALS = 'Credenciales inválidas';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
  refreshMaxAge: number;
  role: UserRole;
}

export function toPublicUser(user: IUser): PublicUser {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

// bcrypt solo usa los primeros 72 bytes: dos JWT del mismo usuario comparten ese prefijo.
// Se resume el token completo con SHA-256 (64 caracteres) antes de pasarlo por bcrypt.
function digestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function issueTokens(user: IUser): Promise<IssuedTokens> {
  const userId = user._id.toString();
  const accessToken = signAccessToken({ sub: userId, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(userId);
  await updateRefreshToken(userId, await bcrypt.hash(digestToken(refreshToken), SALT_ROUNDS));
  return {
    accessToken,
    refreshToken,
    accessMaxAge: ACCESS_TOKEN_MAX_AGE_MS,
    refreshMaxAge: REFRESH_TOKEN_MAX_AGE_MS,
    role: user.role,
  };
}

export async function register(dto: RegisterDto): Promise<PublicUser> {
  const existing = await findUserByEmail(dto.email);
  if (existing) throw new AppError(409, 'El email ya está registrado');

  const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);
  // Todo registro publico crea un vendedor ('user'); el rol admin solo lo asigna otro admin
  const user = await createUser({ name: dto.name, email: dto.email, password: hashed });
  return toPublicUser(user);
}

export async function login(dto: LoginDto): Promise<IssuedTokens> {
  const user = await findUserByEmailWithPassword(dto.email);
  // Mismo mensaje para email inexistente y contraseña incorrecta (sin user enumeration)
  if (!user) throw new AppError(401, INVALID_CREDENTIALS);

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new AppError(401, INVALID_CREDENTIALS);

  return issueTokens(user);
}

export async function refreshTokens(token: string): Promise<IssuedTokens> {
  let userId: string;
  try {
    userId = verifyRefreshToken(token).sub;
  } catch {
    throw new AppError(401, 'Refresh token inválido o expirado');
  }

  const user = await findUserByIdWithRefresh(userId);
  if (!user || !user.refreshToken) throw new AppError(401, 'Sesión no válida');

  const matches = await bcrypt.compare(digestToken(token), user.refreshToken);
  if (!matches) {
    // Refresh ya rotado reutilizado: posible robo -> se invalida la sesion completa
    await updateRefreshToken(userId, null);
    throw new AppError(401, 'Refresh token reutilizado — sesión invalidada');
  }

  // Rotacion: nuevo par de tokens y el hash anterior queda reemplazado
  return issueTokens(user);
}

export async function logout(userId: string): Promise<void> {
  await updateRefreshToken(userId, null);
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return toPublicUser(user);
}
