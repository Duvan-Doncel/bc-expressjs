// src/schemas/auth.schema.ts - Validacion Zod de registro, login y cambio de rol
import { z } from 'zod';
import { USER_ROLES } from '../models/user.model.js';

// z.string() rechaza objetos como { "$gt": "" }: primera barrera contra NoSQL injection en login
const emailSchema = z.string('El email es requerido').trim().toLowerCase().pipe(z.email('Email inválido'));

export const registerSchema = z
  .object({
    name: z
      .string('El nombre es requerido')
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(80)
      .regex(/^[^<>]*$/, 'El nombre no puede contener HTML'),
    email: emailSchema,
    password: z
      .string('La contraseña es requerida')
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres') // bcrypt solo usa los primeros 72 bytes
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
  })
  .strict(); // el rol NO se puede elegir al registrarse

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string('La contraseña es requerida').min(1, 'La contraseña es requerida'),
});

export const updateRoleSchema = z.object({
  role: z.enum(USER_ROLES, `role debe ser uno de: ${USER_ROLES.join(', ')}`),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
