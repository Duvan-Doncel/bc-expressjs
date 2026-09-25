import { ProductModel, type IProduct } from '../models/item.model.js';
import type { CreateProductDto, UpdateProductDto, ProductQuery } from '../types/index.js';

// ============================================================
// REPOSITORIO DE PRODUCTOS — capa de acceso a datos
// ============================================================
// En los unit tests, ESTE módulo se mockea con jest.mock().
// En los integration tests, accede a MongoDB Memory Server.
// ============================================================

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findAllProducts(query: ProductQuery): Promise<{ data: IProduct[]; total: number }> {
  const filter: Record<string, unknown> = {};
  if (query.category) filter['category'] = query.category;
  if (query.search) filter['name'] = { $regex: escapeRegex(query.search), $options: 'i' };
  if (query.available !== undefined) filter['available'] = query.available;

  const [data, total] = await Promise.all([
    ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean<IProduct[]>()
      .exec(),
    ProductModel.countDocuments(filter).exec(),
  ]);
  return { data, total };
}

export async function findProductById(id: string): Promise<IProduct | null> {
  return ProductModel.findById(id).lean<IProduct>().exec();
}

export async function findProductBySku(sku: string): Promise<IProduct | null> {
  return ProductModel.findOne({ sku: sku.toUpperCase() }).lean<IProduct>().exec();
}

export async function createProduct(dto: CreateProductDto, createdBy: string): Promise<IProduct> {
  const product = await ProductModel.create({ ...dto, createdBy });
  return product.toObject();
}

export async function updateProduct(id: string, dto: UpdateProductDto): Promise<IProduct | null> {
  return ProductModel.findByIdAndUpdate(id, dto, { new: true, runValidators: true }).lean<IProduct>().exec();
}

// Descuento atomico: solo descuenta si hay stock suficiente (evita stock negativo con ventas simultaneas)
export async function decrementStock(id: string, quantity: number): Promise<IProduct | null> {
  return ProductModel.findOneAndUpdate(
    { _id: id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true },
  )
    .lean<IProduct>()
    .exec();
}

export async function setAvailability(id: string, available: boolean): Promise<IProduct | null> {
  return ProductModel.findByIdAndUpdate(id, { available }, { new: true }).lean<IProduct>().exec();
}

export async function deleteProduct(id: string): Promise<IProduct | null> {
  return ProductModel.findByIdAndDelete(id).lean<IProduct>().exec();
}
