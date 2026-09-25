import { createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';
import * as usersRepository from '../repositories/users.repository';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_TOKEN_MAX_AGE_MS,
  REFRESH_TOKEN_MAX_AGE_MS,
} from '../utils/jwt';
import { RegisterDto, LoginDto } from '../schemas/auth.schema';
import { IUser } from '../models/user.model';

const SALT_ROUNDS = 10;
const INVALID_CREDENTIALS = 'Credenciales inválidas';

export interface TokenCookieOptions {
  accessToken: string;
  refreshToken: string;
  accessMaxAge: number;
  refreshMaxAge: number;
}

// bcrypt solo usa los primeros 72 bytes de la entrada, y dos JWT del mismo usuario comparten
// header + inicio del payload: sin este paso, bcrypt.compare aceptaria un refresh token viejo.
// El SHA-256 (64 caracteres hex) resume el token completo y cabe entero en bcrypt.
function digestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Emite un par nuevo de tokens y guarda SOLO el hash del refresh token
async function issueTokens(user: IUser): Promise<TokenCookieOptions> {
  const userId = user._id.toString();
  const accessToken = signAccessToken({ sub: userId, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: userId });

  const hashedRefresh = await bcrypt.hash(digestToken(refreshToken), SALT_ROUNDS);
  await usersRepository.updateRefreshToken(userId, hashedRefresh);

  return {
    accessToken,
    refreshToken,
    accessMaxAge: ACCESS_TOKEN_MAX_AGE_MS,
    refreshMaxAge: REFRESH_TOKEN_MAX_AGE_MS,
  };
}

export async function register(dto: RegisterDto): Promise<IUser> {
  const existing = await usersRepository.findByEmail(dto.email);
  if (existing) throw new AppError(409, 'El email ya está registrado');

  const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
  return usersRepository.create({ ...dto, password: hashedPassword });
}

export async function login(dto: LoginDto): Promise<TokenCookieOptions> {
  const user = await usersRepository.findByEmailWithPassword(dto.email);

  // Mismo mensaje para email no encontrado Y contraseña incorrecta
  // — previene user enumeration attacks
  if (!user) throw new AppError(401, INVALID_CREDENTIALS);

  const isMatch = await bcrypt.compare(dto.password, user.password);
  if (!isMatch) throw new AppError(401, INVALID_CREDENTIALS);

  return issueTokens(user);
}

export async function refresh(incomingToken: string): Promise<TokenCookieOptions> {
  // 1. Verificar firma y expiración del refresh token
  let userId: string;
  try {
    userId = verifyRefreshToken(incomingToken).sub;
  } catch {
    throw new AppError(401, 'Refresh token inválido o expirado');
  }

  // 2. Cargar usuario con su hash de refresh token
  const user = await usersRepository.findByIdWithTokens(userId);
  if (!user || !user.refreshToken) {
    throw new AppError(401, 'Sesión no válida');
  }

  // 3. Comparar token recibido con hash almacenado
  const isValid = await bcrypt.compare(digestToken(incomingToken), user.refreshToken);
  if (!isValid) {
    // Un refresh token viejo (ya rotado) se está reutilizando: posible robo.
    // Se invalida la sesión completa y el usuario debe volver a hacer login.
    await usersRepository.updateRefreshToken(userId, undefined);
    throw new AppError(401, 'Refresh token reutilizado — sesión invalidada');
  }

  // 4. Rotar: nuevo par de tokens, el hash anterior queda reemplazado
  return issueTokens(user);
}

export async function logout(userId: string): Promise<void> {
  // Invalidar refresh token en la base de datos
  await usersRepository.updateRefreshToken(userId, undefined);
}

export async function getMe(userId: string): Promise<IUser> {
  const user = await usersRepository.findById(userId);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return user;
}
