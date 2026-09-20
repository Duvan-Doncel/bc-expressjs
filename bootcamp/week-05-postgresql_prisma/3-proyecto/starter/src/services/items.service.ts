// src/services/items.service.ts - Logica de negocio
import * as repo from '../repositories/items.repository';
import { AppError } from '../errors/AppError';
import type { CreateItemDto, UpdateItemDto } from '../schemas/items.schema';

export async function listItems(page: number, limit: number): Promise<repo.PaginatedProducts> {
  return repo.findAll(page, limit);
}

export async function getItem(id: number): Promise<repo.ProductWithCategory> {
  const product = await repo.findById(id);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function createItem(data: CreateItemDto): Promise<repo.ProductWithCategory> {
  return repo.create(data);
}

export async function updateItem(id: number, data: UpdateItemDto): Promise<repo.ProductWithCategory> {
  return repo.update(id, data);
}

export async function deleteItem(id: number): Promise<void> {
  return repo.remove(id);
}