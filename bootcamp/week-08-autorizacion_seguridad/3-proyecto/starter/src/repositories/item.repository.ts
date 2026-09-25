// src/repositories/item.repository.ts - Acceso a datos de Product con Mongoose
import { Types } from 'mongoose';
import { Product, type IProduct, type ProductCategory } from '../models/item.model.js';
import { toAppError } from '../errors/mongoErrors.js';
import type { CreateProductDto, UpdateProductDto } from '../schemas/item.schema.js';

// Producto con el vendedor populado (solo nombre, nunca email ni password en el catalogo publico)
export type ProductDoc = Omit<IProduct, 'createdBy'> & {
  _id: Types.ObjectId;
  createdBy: { _id: Types.ObjectId; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
  onlyAvailable?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

const ENTITY = 'producto';
const SELLER_FIELDS = 'name';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAll(page: number, limit: number, filters: ProductFilters): Promise<PaginatedResult<ProductDoc>> {
  const filter: Record<string, unknown> = {};
  if (filters.search) filter['name'] = { $regex: escapeRegex(filters.search), $options: 'i' };
  if (filters.category) filter['category'] = filters.category;
  if (filters.onlyAvailable) filter['available'] = true;

  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate('createdBy', SELLER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ProductDoc[]>(),
    Product.countDocuments(filter),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findById(id: string): Promise<ProductDoc | null> {
  try {
    return await Product.findById(id).populate('createdBy', SELLER_FIELDS).lean<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

// Solo el id del dueño: para decidir si el usuario puede editar
export async function findOwnerId(id: string): Promise<string | null> {
  try {
    const product = await Product.findById(id).select('createdBy').lean<{ createdBy: Types.ObjectId }>();
    return product ? product.createdBy.toString() : null;
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function create(data: CreateProductDto & { createdBy: string }): Promise<ProductDoc> {
  try {
    const product = await Product.create(data);
    await product.populate('createdBy', SELLER_FIELDS);
    return product.toObject<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function updateById(id: string, data: UpdateProductDto): Promise<ProductDoc | null> {
  try {
    return await Product.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('createdBy', SELLER_FIELDS)
      .lean<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function deleteById(id: string): Promise<boolean> {
  try {
    return (await Product.findByIdAndDelete(id).lean()) !== null;
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}
