// src/services/primary.service.ts - Logica de negocio de Product
import * as repo from '../repositories/primary.repository';
import * as categoryRepo from '../repositories/secondary.repository';
import { AppError } from '../errors/AppError';
import type { CreatePrimaryDto, UpdatePrimaryDto } from '../schemas/primary.schema';

async function assertCategoryExists(categoryId: string): Promise<void> {
  if (!(await categoryRepo.exists(categoryId))) {
    throw new AppError(400, 'La categoria indicada no existe');
  }
}

export async function getAll(
  page: number,
  limit: number,
  search?: string,
): Promise<repo.PaginatedResult<repo.ProductWithCategory>> {
  return repo.findAll(page, limit, search);
}

export async function getById(id: string): Promise<repo.ProductWithCategory> {
  const product = await repo.findById(id);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function createPrimary(dto: CreatePrimaryDto): Promise<repo.ProductWithCategory> {
  await assertCategoryExists(dto.category);
  return repo.create(dto);
}

export async function updatePrimary(id: string, dto: UpdatePrimaryDto): Promise<repo.ProductWithCategory> {
  if (dto.category) await assertCategoryExists(dto.category);
  const product = await repo.update(id, dto);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function deletePrimary(id: string): Promise<void> {
  const product = await repo.remove(id);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
}
