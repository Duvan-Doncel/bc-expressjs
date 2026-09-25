// src/repositories/secondary.repository.ts - Acceso a datos de Category con Mongoose
import { Types } from 'mongoose';
import { Category, type ICategory } from '../models/secondary.model';
import { toAppError } from '../errors/mongoErrors';
import type { CreateSecondaryDto, UpdateSecondaryDto } from '../schemas/secondary.schema';

export type CategoryDoc = ICategory & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };

const ENTITY = 'categoria';

export async function findAll(): Promise<CategoryDoc[]> {
  return Category.find().sort({ name: 1 }).lean<CategoryDoc[]>();
}

export async function findById(id: string): Promise<CategoryDoc | null> {
  try {
    return await Category.findById(id).lean<CategoryDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function exists(id: string): Promise<boolean> {
  try {
    return (await Category.exists({ _id: id })) !== null;
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function create(dto: CreateSecondaryDto): Promise<CategoryDoc> {
  try {
    const category = await Category.create(dto);
    return category.toObject<CategoryDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

// returnDocument: 'after' equivale a { new: true } (deprecado en Mongoose 9)
export async function update(id: string, dto: UpdateSecondaryDto): Promise<CategoryDoc | null> {
  try {
    return await Category.findByIdAndUpdate(id, dto, { returnDocument: 'after', runValidators: true }).lean<CategoryDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}

export async function remove(id: string): Promise<CategoryDoc | null> {
  try {
    return await Category.findByIdAndDelete(id).lean<CategoryDoc>();
  } catch (err) {
    throw toAppError(err, ENTITY);
  }
}
