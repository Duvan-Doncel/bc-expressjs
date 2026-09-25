// src/models/product.model.ts - Modelo Product (mercado campesino)
// createdBy guarda el vendedor que registro el producto: el dueño puede editar SU producto,
// pero solo el administrador puede eliminarlo.
import { Schema, model, Types } from 'mongoose';

export const PRODUCT_CATEGORIES = ['verduras', 'frutas', 'lacteos', 'granos', 'tuberculos'] as const;
export const PRODUCT_UNITS = ['kg', 'libra', 'litro', 'unidad', 'atado', 'docena'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface IProduct {
  name: string;
  sku: string;
  category: ProductCategory;
  price: number; // precio en COP
  stock: number;
  unit: ProductUnit;
  available: boolean;
  farmer?: string;
  createdBy: Types.ObjectId;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [120, 'El nombre no puede superar 120 caracteres'],
    },
    sku: {
      type: String,
      required: [true, 'El sku es requerido'],
      trim: true,
      uppercase: true,
      minlength: [3, 'El sku debe tener al menos 3 caracteres'],
      maxlength: [30, 'El sku no puede superar 30 caracteres'],
      unique: true,
    },
    category: {
      type: String,
      required: [true, 'La categoria es requerida'],
      enum: { values: PRODUCT_CATEGORIES, message: 'Categoria no permitida: {VALUE}' },
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'El precio es requerido'],
      min: [50, 'El precio minimo es 50 COP'],
      max: [5_000_000, 'El precio maximo es 5.000.000 COP'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
      validate: { validator: Number.isInteger, message: 'El stock debe ser entero' },
    },
    unit: {
      type: String,
      enum: { values: PRODUCT_UNITS, message: 'Unidad no permitida: {VALUE}' },
      default: 'kg',
    },
    available: { type: Boolean, default: true },
    farmer: {
      type: String,
      trim: true,
      maxlength: [100, 'El nombre del productor no puede superar 100 caracteres'],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

// 'Product' -> coleccion 'products'
export const Product = model<IProduct>('Product', productSchema);
