import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../models/item.model.js';

// ============================================================
// SCHEMAS ZOD — Product (mercado campesino)
// ============================================================

const NO_HTML = /^[^<>]*$/;

const productFields = z.object({
  name: z.string().trim().min(2, 'name debe tener al menos 2 caracteres').max(120).regex(NO_HTML, 'name no puede contener HTML'),
  sku: z.string().trim().regex(/^[A-Za-z0-9-]{3,30}$/, 'sku solo admite letras, numeros y guiones (3 a 30)'),
  category: z.enum(PRODUCT_CATEGORIES, `category debe ser uno de: ${PRODUCT_CATEGORIES.join(', ')}`),
  price: z.number('price debe ser un numero').min(50, 'price minimo es 50 COP').max(5_000_000, 'price maximo es 5.000.000 COP'),
  stock: z.number('stock debe ser un numero').int('stock debe ser entero').nonnegative('stock no puede ser negativo'),
  unit: z.enum(PRODUCT_UNITS, `unit debe ser uno de: ${PRODUCT_UNITS.join(', ')}`),
  available: z.boolean('available debe ser true o false'),
  farmer: z.string().trim().max(100).regex(NO_HTML, 'farmer no puede contener HTML'),
});

export const createProductSchema = z.object({
  body: productFields
    .extend({
      stock: productFields.shape.stock.default(0),
      unit: productFields.shape.unit.default('kg'),
      available: productFields.shape.available.default(true),
      farmer: productFields.shape.farmer.optional(),
    })
    .strict(), // createdBy u otros campos desconocidos -> 422
});

// PUT con actualizacion parcial: todos los campos opcionales, al menos uno
export const updateProductSchema = z.object({
  body: productFields
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, { message: 'Envia al menos un campo para actualizar' }),
});

// Registrar una venta en el puesto: descuenta stock
export const sellProductSchema = z.object({
  body: z.object({
    quantity: z.number('quantity debe ser un numero').int('quantity debe ser entero').positive('quantity debe ser mayor a 0'),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de MongoDB invalido'),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).catch(1),
    limit: z.coerce.number().int().min(1).max(100).catch(10),
    category: z.enum(PRODUCT_CATEGORIES).optional().catch(undefined),
    search: z.string().trim().max(60).optional().catch(undefined),
    available: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .catch(undefined),
  }),
});
