// ============================================
// REPOSITORY - acceso a datos en memoria (Product)
// ============================================
import { Product } from '../types';

export type CreateItemRepoDto = Omit<Product, 'id' | 'createdAt'>;
export type UpdateItemRepoDto = Partial<CreateItemRepoDto>;

const items: Product[] = [
  { id: 1, name: 'Tomate chonto', category: 'verduras', price: 3500, stock: 120, unit: 'kg', createdAt: new Date() },
  { id: 2, name: 'Mango tommy', category: 'frutas', price: 4200, stock: 80, unit: 'kg', createdAt: new Date() },
  { id: 3, name: 'Leche entera', category: 'lacteos', price: 3800, stock: 40, unit: 'litro', createdAt: new Date() },
  { id: 4, name: 'Frijol cargamanto', category: 'granos', price: 7500, stock: 60, unit: 'kg', createdAt: new Date() },
];

let nextId = 5;

export async function findAll(): Promise<Product[]> {
  return items.map((i) => ({ ...i }));
}

export async function findById(id: number): Promise<Product | undefined> {
  const found = items.find((i) => i.id === id);
  return found ? { ...found } : undefined;
}

export async function create(dto: CreateItemRepoDto): Promise<Product> {
  const product: Product = { id: nextId++, ...dto, createdAt: new Date() };
  items.push(product);
  return { ...product };
}

export async function update(id: number, dto: UpdateItemRepoDto): Promise<Product | undefined> {
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index]!, ...dto };
  return { ...items[index]! };
}

export async function remove(id: number): Promise<boolean> {
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return false;
  items.splice(index, 1);
  return true;
}
