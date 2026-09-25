import mongoose, { Schema, Types } from 'mongoose';

// ============================================================
// MODELO Product — catalogo del puesto del mercado campesino
// ============================================================

export const PRODUCT_CATEGORIES = ['verduras', 'frutas', 'lacteos', 'granos', 'tuberculos'] as const;
export const PRODUCT_UNITS = ['kg', 'libra', 'litro', 'unidad', 'atado', 'docena'] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductUnit = (typeof PRODUCT_UNITS)[number];

export interface IProduct {
  _id: Types.ObjectId;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number; // precio en COP
  stock: number;
  unit: ProductUnit;
  available: boolean;
  farmer?: string;
  createdBy: Types.ObjectId; // vendedor que registro el producto
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    sku: { type: String, required: true, trim: true, uppercase: true, minlength: 3, maxlength: 30, unique: true },
    category: { type: String, required: true, enum: PRODUCT_CATEGORIES, index: true },
    price: { type: Number, required: true, min: 50, max: 5_000_000 },
    stock: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger, message: 'El stock debe ser entero' } },
    unit: { type: String, enum: PRODUCT_UNITS, default: 'kg' },
    available: { type: Boolean, default: true },
    farmer: { type: String, trim: true, maxlength: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true },
);

// 'Product' -> coleccion 'products'
export const ProductModel = mongoose.model<IProduct>('Product', ProductSchema);
