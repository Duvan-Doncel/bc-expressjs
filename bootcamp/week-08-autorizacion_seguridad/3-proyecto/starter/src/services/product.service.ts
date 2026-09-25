// src/services/product.service.ts - Logica de negocio de Product (catalogo del puesto)
import { AppError } from '../errors/AppError.js';
import * as productRepository from '../repositories/product.repository.js';
import type { CreateProductDto, UpdateProductDto } from '../schemas/product.schema.js';
import type { JwtPayload } from '../utils/jwt.js';

// Politica de propiedad: el vendedor edita SUS productos; el administrador, cualquiera.
// (El "solo admin puede eliminar" se aplica en la ruta con requireRole('admin').)
function canEditProduct(requester: JwtPayload, ownerId: string): boolean {
  return requester.role === 'admin' || requester.sub === ownerId;
}

export async function getProducts(
  page: number,
  limit: number,
  filters: productRepository.ProductFilters,
): Promise<productRepository.PaginatedResult<productRepository.ProductDoc>> {
  return productRepository.findAll(page, limit, filters);
}

export async function getProductById(id: string): Promise<productRepository.ProductDoc> {
  const product = await productRepository.findById(id);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function createProduct(dto: CreateProductDto, sellerId: string): Promise<productRepository.ProductDoc> {
  // createdBy sale del token, nunca del body
  return productRepository.create({ ...dto, createdBy: sellerId });
}

export async function updateProduct(
  id: string,
  dto: UpdateProductDto,
  requester: JwtPayload,
): Promise<productRepository.ProductDoc> {
  const ownerId = await productRepository.findOwnerId(id);
  if (!ownerId) throw new AppError(404, `Producto ${id} no encontrado`);
  if (!canEditProduct(requester, ownerId)) {
    throw new AppError(403, 'Solo puedes editar los productos que registraste');
  }

  const product = await productRepository.updateById(id, dto);
  if (!product) throw new AppError(404, `Producto ${id} no encontrado`);
  return product;
}

export async function deleteProduct(id: string): Promise<void> {
  const deleted = await productRepository.deleteById(id);
  if (!deleted) throw new AppError(404, `Producto ${id} no encontrado`);
}
