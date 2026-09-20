// src/schemas/items.schema.ts - Validacion Zod (Product, mercado campesino)
import { z } from 'zod';

const requiredString = (label: string) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} es obligatorio` : `${label} debe ser texto`),
  });

const requiredNumber = (label: string) =>
  z.number({
    error: (issue) => (issue.input === undefined ? `${label} es obligatorio` : `${label} debe ser un numero`),
  });

// Base SIN defaults: asi el schema de update no pisa campos que no se enviaron
const productBase = z.object({
  name: requiredString('name').trim().min(1, 'name no puede estar vacio').max(120, 'name es demasiado largo'),
  sku: requiredString('sku').trim().min(3, 'sku debe tener al menos 3 caracteres').max(30, 'sku es demasiado largo'),
  price: requiredNumber('price').positive('price debe ser mayor a 0'),
  stock: requiredNumber('stock').int('stock debe ser entero').nonnegative('stock no puede ser negativo'),
  unit: requiredString('unit').trim().min(1, 'unit no puede estar vacio'),
  available: z.boolean('available debe ser true o false'),
  categoryId: requiredNumber('categoryId').int('categoryId debe ser entero').positive('categoryId debe ser mayor a 0'),
});

export const createItemSchema = productBase.extend({
  stock: productBase.shape.stock.default(0),
  unit: productBase.shape.unit.default('kg'),
  available: productBase.shape.available.default(true),
});

export const updateItemSchema = productBase.partial();

export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;