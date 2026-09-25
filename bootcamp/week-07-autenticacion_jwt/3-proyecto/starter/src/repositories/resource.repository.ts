// src/repositories/resource.repository.ts - Acceso a datos de Product con Mongoose
import { Types } from 'mongoose';
import { ProductModel, type IProduct, type ProductCategory } from '../models/resource.model';
import { toAppError } from '../errors/mongoErrors';
import type { CreateProductDto, UpdateProductDto } from '../schemas/resource.schema';

// Producto con el usuario creador populado (solo nombre y email, nunca password)
export type ProductDoc = Omit<IProduct, 'createdBy'> & {
  _id: Types.ObjectId;
  createdBy: { _id: Types.ObjectId; name: string; email: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface ProductFilters {
  search?: string;
  category?: ProductCategory;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

const ENTITY = 'producto';
const CREATED_BY_FIELDS = 'name email';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAll(
  page: number,
  limit: number,
  filters: ProductFilters = {},
): Promise<PaginatedResult<ProductDoc>> {
  const filter: Record<string, unknown> = {};
  if (filters.search) filter['name'] = { $regex: escapeRegex(filters.search), $options: 'i' };
  if (filters.category) filter['category'] = filters.category;

  const [data, total] = await Promise.all([
    ProductModel.find(filter)
      .populate('createdBy', CREATED_BY_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<ProductDoc[]>(),
    ProductModel.countDocuments(filter),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findById(id: string): Promise<ProductDoc | null> {
  try {
    return await ProductModel.findById(id).populate('createdBy', CREATED_BY_FIELDS).lean<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function create(data: CreateProductDto & { createdBy: string }): Promise<ProductDoc> {
  try {
    const product = await ProductModel.create(data);
    await product.populate('createdBy', CREATED_BY_FIELDS);
    return product.toObject<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function updateById(id: string, data: UpdateProductDto): Promise<ProductDoc | null> {
  try {
    // returnDocument: 'after' equivale a { new: true } (deprecado en Mongoose 9)
    return await ProductModel.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true })
      .populate('createdBy', CREATED_BY_FIELDS)
      .lean<ProductDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function deleteById(id: string): Promise<boolean> {
  try {
    const deleted = await ProductModel.findByIdAndDelete(id).lean();
    return deleted !== null;
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}
