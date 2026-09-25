// src/schemas/auth.schema.ts - Validacion Zod de registro y login
import { z } from 'zod';

const emailSchema = z.string('El email es requerido').trim().toLowerCase().pipe(z.email('Email inválido'));

export const registerSchema = z
  .object({
    email: emailSchema,
    password: z
      .string('La contraseña es requerida')
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres') // bcrypt solo usa los primeros 72 bytes
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    name: z.string('El nombre es requerido').trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  })
  .strict(); // el rol no se puede elegir al registrarse

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string('La contraseña es requerida').min(1, 'La contraseña es requerida'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
