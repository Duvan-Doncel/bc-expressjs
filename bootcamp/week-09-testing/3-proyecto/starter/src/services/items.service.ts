import { AppError } from '../errors/AppError.js';
import type { CreateProductDto, UpdateProductDto, ProductQuery, Paginated, UserRole } from '../types/index.js';
import type { IProduct } from '../models/item.model.js';
import * as productsRepo from '../repositories/items.repository.js';

// ============================================================
// PRODUCTS SERVICE — logica de negocio del puesto del mercado
// ============================================================
// - sku unico por producto (409 si ya existe)
// - el vendedor edita SOLO sus productos; el admin, cualquiera
// - una venta descuenta stock y nunca lo deja negativo
// - al agotarse el stock, el producto queda como no disponible
// ============================================================

function notFound(id: string): AppError {
  return new AppError(404, `Producto ${id} no encontrado`);
}

export async function getAll(query: ProductQuery): Promise<Paginated<IProduct>> {
  const { data, total } = await productsRepo.findAllProducts(query);
  return { data, total, page: query.page, totalPages: Math.ceil(total / query.limit) };
}

export async function getById(id: string): Promise<IProduct> {
  const product = await productsRepo.findProductById(id);
  if (!product) throw notFound(id);
  return product;
}

export async function create(dto: CreateProductDto, createdBy: string): Promise<IProduct> {
  const duplicated = await productsRepo.findProductBySku(dto.sku);
  if (duplicated) throw new AppError(409, `Ya existe un producto con el sku ${dto.sku.toUpperCase()}`);
  return productsRepo.createProduct(dto, createdBy);
}

export async function update(
  id: string,
  dto: UpdateProductDto,
  requesterId: string,
  requesterRole: UserRole,
): Promise<IProduct> {
  const existing = await productsRepo.findProductById(id);
  if (!existing) throw notFound(id);

  if (existing.createdBy.toString() !== requesterId && requesterRole !== 'admin') {
    throw new AppError(403, 'Solo puedes editar los productos que registraste');
  }

  if (dto.sku && dto.sku.toUpperCase() !== existing.sku) {
    const duplicated = await productsRepo.findProductBySku(dto.sku);
    if (duplicated) throw new AppError(409, `Ya existe un producto con el sku ${dto.sku.toUpperCase()}`);
  }

  const updated = await productsRepo.updateProduct(id, dto);
  if (!updated) throw notFound(id);
  return updated;
}

export async function sell(id: string, quantity: number): Promise<IProduct> {
  const product = await productsRepo.findProductById(id);
  if (!product) throw notFound(id);
  if (!product.available) throw new AppError(400, `${product.name} no esta disponible para la venta`);
  if (product.stock < quantity) {
    throw new AppError(400, `Stock insuficiente: quedan ${product.stock} ${product.unit} de ${product.name}`);
  }

  const updated = await productsRepo.decrementStock(id, quantity);
  // null = otra venta se llevo el stock entre la lectura y el descuento
  if (!updated) throw new AppError(409, 'El stock cambio durante la venta, intenta de nuevo');

  if (updated.stock === 0) {
    const soldOut = await productsRepo.setAvailability(id, false);
    return soldOut ?? updated;
  }
  return updated;
}

// Solo admin: la restriccion de rol se aplica en la ruta con authorize('admin')
export async function remove(id: string): Promise<void> {
  const deleted = await productsRepo.deleteProduct(id);
  if (!deleted) throw notFound(id);
}
