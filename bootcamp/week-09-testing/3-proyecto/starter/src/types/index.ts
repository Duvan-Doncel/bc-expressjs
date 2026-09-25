import type { z } from 'zod';
import type {
  createProductSchema,
  updateProductSchema,
  sellProductSchema,
  productQuerySchema,
} from '../validators/items.schema.js';
import type { registerSchema, loginSchema } from '../validators/auth.schema.js';

export type UserRole = 'user' | 'admin';

export type RegisterDto = z.infer<typeof registerSchema>['body'];
export type LoginDto = z.infer<typeof loginSchema>['body'];

export interface TokenPayload {
  sub: string;
  role: UserRole;
}

// DTOs del recurso Product (derivados de Zod: una sola fuente de verdad)
export type CreateProductDto = z.infer<typeof createProductSchema>['body'];
export type UpdateProductDto = z.infer<typeof updateProductSchema>['body'];
export type SellProductDto = z.infer<typeof sellProductSchema>['body'];
export type ProductQuery = z.infer<typeof productQuerySchema>['query'];

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
