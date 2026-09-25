import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError.js';
import type { LoginDto, RegisterDto, UserRole } from '../types/index.js';
import * as usersRepo from '../repositories/users.repository.js';
import { signAccessToken } from '../utils/jwt.js';

const BCRYPT_ROUNDS = 12;
const INVALID_CREDENTIALS = 'Credenciales invalidas';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

function toPublicUser(user: { _id: { toString(): string }; name: string; email: string; role: UserRole }): PublicUser {
  return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

export async function register(dto: RegisterDto): Promise<PublicUser> {
  const existing = await usersRepo.findUserByEmail(dto.email);
  if (existing) throw new AppError(409, 'El email ya esta registrado');

  const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
  // El registro publico siempre crea un vendedor ('user')
  const user = await usersRepo.createUser({ ...dto, password: hashedPassword, role: 'user' });
  return toPublicUser(user);
}

export async function login(dto: LoginDto): Promise<{ accessToken: string; user: PublicUser }> {
  const user = await usersRepo.findUserByEmailWithPassword(dto.email);
  // Mismo mensaje para email inexistente y contraseña incorrecta (sin user enumeration)
  if (!user) throw new AppError(401, INVALID_CREDENTIALS);

  const match = await bcrypt.compare(dto.password, user.password);
  if (!match) throw new AppError(401, INVALID_CREDENTIALS);

  const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });
  return { accessToken, user: toPublicUser(user) };
}

export async function getMe(userId: string): Promise<PublicUser> {
  const user = await usersRepo.findUserById(userId);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return toPublicUser(user);
}
