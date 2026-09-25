// src/services/user.service.ts - Gestion de usuarios (solo administrador, protegido en la ruta)
import { AppError } from '../errors/AppError.js';
import * as usersRepository from '../repositories/users.repository.js';
import { toPublicUser, type PublicUser } from './auth.service.js';
import type { UserRole } from '../models/user.model.js';

export async function listUsers(): Promise<PublicUser[]> {
  const users = await usersRepository.listUsers();
  return users.map(toPublicUser);
}

export async function changeRole(targetId: string, role: UserRole, requesterId: string): Promise<PublicUser> {
  // Evita que el unico admin se quite el rol a si mismo por error
  if (targetId === requesterId) throw new AppError(400, 'No puedes cambiar tu propio rol');
  const user = await usersRepository.updateRole(targetId, role);
  if (!user) throw new AppError(404, 'Usuario no encontrado');
  return toPublicUser(user);
}
