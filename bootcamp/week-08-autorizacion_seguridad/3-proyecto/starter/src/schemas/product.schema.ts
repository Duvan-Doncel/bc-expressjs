// src/schemas/product.schema.ts - Validacion Zod de Product
// Los textos libres rechazan < y > (defensa en profundidad contra XSS almacenado).
import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../models/product.model.js';

const NO_HTML = /^[^<>]*$/;

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido');

const requiredString = (label: string) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} es obligatorio` : `${label} debe ser texto`),
  });

const requiredNumber = (label: string) =>
  z.number({
    error: (issue) => (issue.input === undefined ? `${label} es obligatorio` : `${label} debe ser un numero`),
  });

// Base SIN defaults: asi el schema de PATCH no pisa campos que no se enviaron
const productBase = z.object({
  name: requiredString('name')
    .trim()
    .min(2, 'name debe tener al menos 2 caracteres')
    .max(120, 'name es demasiado largo')
    .regex(NO_HTML, 'name no puede contener HTML'),
  sku: requiredString('sku')
    .trim()
    .regex(/^[A-Za-z0-9-]{3,30}$/, 'sku solo admite letras, numeros y guiones (3 a 30)'),
  category: z.enum(PRODUCT_CATEGORIES, `category debe ser uno de: ${PRODUCT_CATEGORIES.join(', ')}`),
  price: requiredNumber('price').min(50, 'price minimo es 50 COP').max(5_000_000, 'price maximo es 5.000.000 COP'),
  stock: requiredNumber('stock').int('stock debe ser entero').nonnegative('stock no puede ser negativo'),
  unit: z.enum(PRODUCT_UNITS, `unit debe ser uno de: ${PRODUCT_UNITS.join(', ')}`),
  available: z.boolean('available debe ser true o false'),
  farmer: z
    .string('farmer debe ser texto')
    .trim()
    .max(100, 'farmer es demasiado largo')
    .regex(NO_HTML, 'farmer no puede contener HTML'),
});

// .strict(): rechaza campos desconocidos (por ejemplo createdBy o role enviados por el cliente)
export const createProductSchema = productBase
  .extend({
    stock: productBase.shape.stock.default(0),
    unit: productBase.shape.unit.default('kg'),
    available: productBase.shape.available.default(true),
    farmer: productBase.shape.farmer.optional(),
  })
  .strict();

export const updateProductSchema = productBase
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envia al menos un campo para actualizar' });

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
