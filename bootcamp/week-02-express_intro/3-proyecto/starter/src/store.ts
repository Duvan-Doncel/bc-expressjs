import type { Product, CreateProductDto, UpdateProductDto } from './types.js';

// Store en memoria — simula una base de datos sin persistencia
const products: Product[] = [];
let nextId = 1;

// Retorna todos los productos
export function getAll(): Product[] {
  return products;
}

// Retorna el producto con el id dado, o undefined si no existe
export function getById(id: number): Product | undefined {
  return products.find((p) => p.id === id);
}

// Crea un nuevo producto con id autoincremental y lo retorna
export function create(data: CreateProductDto): Product {
  const newProduct: Product = { id: nextId++, ...data };
  products.push(newProduct);
  return newProduct;
}

// Actualiza el producto con el id dado y lo retorna, o undefined si no existe
export function update(id: number, data: UpdateProductDto): Product | undefined {
  const product = products.find((p) => p.id === id);
  if (!product) return undefined;
  Object.assign(product, data);
  return product;
}

// Elimina el producto con el id dado, retorna true o false
export function remove(id: number): boolean {
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  return true;
}