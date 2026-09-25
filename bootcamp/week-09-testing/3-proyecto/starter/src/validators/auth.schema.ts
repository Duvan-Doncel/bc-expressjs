import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Email invalido'));

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
      email,
      password: z
        .string()
        .min(8, 'Minimo 8 caracteres')
        .max(72, 'Maximo 72 caracteres')
        .regex(/[A-Z]/, 'Debe contener al menos una mayuscula')
        .regex(/[0-9]/, 'Debe contener al menos un numero'),
    })
    .strict(), // el rol no se elige al registrarse
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'La contraseña es requerida'),
  }),
});
