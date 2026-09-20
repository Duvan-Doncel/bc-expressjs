// src/repositories/items.repository.ts - Acceso a datos con Prisma
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../errors/AppError';
import type { CreateItemDto, UpdateItemDto } from '../schemas/items.schema';

// Tipo derivado de Prisma (no se duplica ninguna interface)
export type ProductWithCategory = Prisma.ProductGetPayload<{ include: { category: true } }>;

export interface PaginatedProducts {
  data: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
}

// Traduce errores conocidos de Prisma a AppError
function toAppError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return new AppError(409, 'Ya existe un registro con ese valor');
    if (err.code === 'P2025') return new AppError(404, 'Recurso no encontrado');
    if (err.code === 'P2003') return new AppError(400, 'La categoria indicada no existe');
  }
  return err;
}

export async function findAll(page: number, limit: number): Promise<PaginatedProducts> {
  const [data, total] = await Promise.all([
    prisma.product.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
    prisma.product.count(),
  ]);
  return { data, total, page, limit };
}

export async function findById(id: number): Promise<ProductWithCategory | null> {
  return prisma.product.findUnique({ where: { id }, include: { category: true } });
}

export async function create(data: CreateItemDto): Promise<ProductWithCategory> {
  try {
    return await prisma.product.create({ data, include: { category: true } });
  } catch (err) {
    throw toAppError(err);
  }
}

export async function update(id: number, data: UpdateItemDto): Promise<ProductWithCategory> {
  try {
    return await prisma.product.update({ where: { id }, data, include: { category: true } });
  } catch (err) {
    throw toAppError(err);
  }
}

export async function remove(id: number): Promise<void> {
  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    throw toAppError(err);
  }
}