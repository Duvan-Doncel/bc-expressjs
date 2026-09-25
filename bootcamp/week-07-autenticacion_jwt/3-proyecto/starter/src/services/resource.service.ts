// src/services/resource.service.ts - Logica de negocio de Product
import * as productRepository from '../repositories/resource.repository';
import type { CreateProductDto, UpdateProductDto } from '../schemas/resource.schema';
import { AppError } from '../errors/AppError';

export async function getAll(
  page: number,
  limit: number,
  filters: productRepository.ProductFilters,
): Promise<productRepository.PaginatedResult<productRepository.ProductDoc>> {
  return productRepository.findAll(page, limit, filters);
}

export async function getById(id: string): Promise<productRepository.ProductDoc> {
  const product = await productRepository.findById(id);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function create(dto: CreateProductDto, userId: string): Promise<productRepository.ProductDoc> {
  // El creador sale del token (req.user.sub), nunca del body
  return productRepository.create({ ...dto, createdBy: userId });
}

export async function update(id: string, dto: UpdateProductDto): Promise<productRepository.ProductDoc> {
  const product = await productRepository.updateById(id, dto);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function remove(id: string): Promise<void> {
  const deleted = await productRepository.deleteById(id);
  if (!deleted) throw new AppError(404, `Producto ${id} no encontrado`);
}
