// ============================================
// SCHEMAS - Product (mercado campesino) - Zod 4
// ============================================
import { z } from 'zod';

export const CATEGORIES = ['verduras', 'frutas', 'lacteos', 'granos'] as const;

export const createItemSchema = z.object({
  name: z
    .string({
      error: (issue) => (issue.input === undefined ? 'name es obligatorio' : 'name debe ser texto'),
    })
    .trim()
    .min(1, 'name no puede estar vacio'),
  category: z.enum(CATEGORIES, {
    error: 'category debe ser verduras, frutas, lacteos o granos',
  }),
  price: z
    .number({
      error: (issue) => (issue.input === undefined ? 'price es obligatorio' : 'price debe ser un numero'),
    })
    .positive('price debe ser mayor a 0'),
  stock: z
    .number()
    .int('stock debe ser entero')
    .nonnegative('stock no puede ser negativo')
    .default(0),
  unit: z.string().trim().min(1, 'unit no puede estar vacio').default('kg'),
});

export const updateItemSchema = createItemSchema.partial();

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
