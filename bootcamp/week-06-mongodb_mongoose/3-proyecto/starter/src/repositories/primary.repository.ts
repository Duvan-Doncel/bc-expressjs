// src/repositories/primary.repository.ts - Acceso a datos de Product con Mongoose + populate()
import { Types } from 'mongoose';
import { Product, type IProduct } from '../models/primary.model';
import { toAppError } from '../errors/mongoErrors';
import type { CategoryDoc } from './secondary.repository';
import type { CreatePrimaryDto, UpdatePrimaryDto } from '../schemas/primary.schema';

// Producto con la categoria populada (objeto completo en lugar del ObjectId)
export type ProductWithCategory = Omit<IProduct, 'category'> & {
  _id: Types.ObjectId;
  category: CategoryDoc | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

const ENTITY = 'producto';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAll(
  page: number,
  limit: number,
  search?: string,
): Promise<PaginatedResult<ProductWithCategory>> {
  const skip = (page - 1) * limit;
  const filter = search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};
  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<ProductWithCategory[]>(),
    Product.countDocuments(filter),
  ]);
  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findById(id: string): Promise<ProductWithCategory | null> {
  try {
    return await Product.findById(id).populate('category').lean<ProductWithCategory>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function countByCategory(categoryId: string): Promise<number> {
  try {
    return await Product.countDocuments({ category: categoryId });
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function create(dto: CreatePrimaryDto): Promise<ProductWithCategory> {
  try {
    const product = await Product.create(dto);
    await product.populate('category');
    return product.toObject<ProductWithCategory>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

// returnDocument: 'after' equivale a { new: true } (deprecado en Mongoose 9): devuelve el documento ya actualizado
export async function update(id: string, dto: UpdatePrimaryDto): Promise<ProductWithCategory | null> {
  try {
    return await Product.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true })
      .populate('category')
      .lean<ProductWithCategory>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function remove(id: string): Promise<ProductWithCategory | null> {
  try {
    return await Product.findByIdAndDelete(id).lean<ProductWithCategory>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}
