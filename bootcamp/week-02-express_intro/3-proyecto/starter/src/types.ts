// ============================================
// TYPES: Interfaz del recurso principal — Producto (mercado campesino)
// ============================================

export interface Product {
  id: number;
  name: string;
  category: 'verduras' | 'frutas' | 'lacteos' | 'granos';
  price: number;
  stock: number;
  unit: string;
}

// DTO usado para crear un nuevo producto (sin id, se genera automáticamente)
export type CreateProductDto = Omit<Product, 'id'>;

// DTO para actualización (todos los campos editables)
export type UpdateProductDto = Partial<CreateProductDto>;