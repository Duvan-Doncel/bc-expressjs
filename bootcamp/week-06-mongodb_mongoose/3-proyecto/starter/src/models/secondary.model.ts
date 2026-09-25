// src/models/secondary.model.ts - Modelo Category (mercado campesino)
import { Schema, model } from 'mongoose';

export const CATEGORY_NAMES = ['verduras', 'frutas', 'lacteos', 'granos', 'tuberculos'] as const;
export type CategoryName = (typeof CATEGORY_NAMES)[number];

export interface ICategory {
  name: CategoryName;
  description?: string;
  active: boolean;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      lowercase: true,
      enum: { values: CATEGORY_NAMES, message: 'Categoria no permitida: {VALUE}' },
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'La descripcion no puede superar 300 caracteres'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// 'Category' -> coleccion 'categories'
export const Category = model<ICategory>('Category', categorySchema);
