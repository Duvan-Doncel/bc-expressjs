// ============================================
// REPOSITORY — Capa de acceso a datos
// ============================================
// - Único punto de acceso al store
// - Todos los métodos son async Promise<T>
// - Retorna copias defensivas (no la referencia interna)
// - Si no encuentra un elemento, retorna undefined
import { Product, CreateProductDto, UpdateProductDto } from '../types';

const store: Product[] = [
  { id: 1, name: 'Tomate chonto', category: 'verduras', price: 3200, stock: 50, unit: 'kg', createdAt: new Date().toISOString() },
  { id: 2, name: 'Papa criolla', category: 'verduras', price: 2800, stock: 80, unit: 'kg', createdAt: new Date().toISOString() },
  { id: 3, name: 'Mango tommy', category: 'frutas', price: 4000, stock: 30, unit: 'kg', createdAt: new Date().toISOString() },
  { id: 4, name: 'Queso campesino', category: 'lacteos', price: 12000, stock: 15, unit: 'unidad', createdAt: new Date().toISOString() },
  { id: 5, name: 'Frijol cargamanto', category: 'granos', price: 6500, stock: 40, unit: 'libra', createdAt: new Date().toISOString() },
];
let nextId = 6;

export async function findAll(): Promise<Product[]> {
  return [...store];
}

export async function findById(id: number): Promise<Product | undefined> {
  return store.find((product) => product.id === id);
}

export async function create(dto: CreateProductDto): Promise<Product> {
  const product: Product = { id: nextId++, ...dto, createdAt: new Date().toISOString() };
  store.push(product);
  return { ...product };
}

export async function update(id: number, dto: UpdateProductDto): Promise<Product | undefined> {
  const index = store.findIndex((product) => product.id === id);
  if (index === -1) return undefined;
  store[index] = { ...store[index]!, ...dto };
  return { ...store[index]! };
}

export async function remove(id: number): Promise<boolean> {
  const index = store.findIndex((product) => product.id === id);
  if (index === -1) return false;
  store.splice(index, 1);
  return true;
}
