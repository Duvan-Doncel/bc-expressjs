// src/services/secondary.service.ts - Logica de negocio de Category
import * as repo from '../repositories/secondary.repository';
import * as productRepo from '../repositories/primary.repository';
import { AppError } from '../errors/AppError';
import type { CreateSecondaryDto, UpdateSecondaryDto } from '../schemas/secondary.schema';

export async function getAll(): Promise<repo.CategoryDoc[]> {
  return repo.findAll();
}

export async function getById(id: string): Promise<repo.CategoryDoc> {
  const category = await repo.findById(id);
  if (!category) throw new AppError(404, `Categoria ${id} no encontrada`);
  return category;
}

export async function createSecondary(dto: CreateSecondaryDto): Promise<repo.CategoryDoc> {
  return repo.create(dto);
}

export async function updateSecondary(id: string, dto: UpdateSecondaryDto): Promise<repo.CategoryDoc> {
  const category = await repo.update(id, dto);
  if (!category) throw new AppError(404, `Categoria ${id} no encontrada`);
  return category;
}

export async function deleteSecondary(id: string): Promise<void> {
  // No se borra una categoria que todavia tiene productos (evita referencias huerfanas)
  const products = await productRepo.countByCategory(id);
  if (products > 0) {
    throw new AppError(409, `La categoria tiene ${products} producto(s) asociados`);
  }
  const category = await repo.remove(id);
  if (!category) throw new AppError(404, `Categoria ${id} no encontrada`);
}
