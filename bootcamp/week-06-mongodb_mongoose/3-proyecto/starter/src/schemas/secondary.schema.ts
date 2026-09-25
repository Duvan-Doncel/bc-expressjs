// src/schemas/secondary.schema.ts - Validacion Zod de Category
import { z } from 'zod';
import { CATEGORY_NAMES } from '../models/secondary.model';

export const createSecondarySchema = z.object({
  name: z.enum(CATEGORY_NAMES, `name debe ser uno de: ${CATEGORY_NAMES.join(', ')}`),
  description: z.string('description debe ser texto').trim().max(300, 'description es demasiado larga').optional(),
  active: z.boolean('active debe ser true o false').optional(),
});

export const updateSecondarySchema = createSecondarySchema.partial();

export type CreateSecondaryDto = z.infer<typeof createSecondarySchema>;
export type UpdateSecondaryDto = z.infer<typeof updateSecondarySchema>;
