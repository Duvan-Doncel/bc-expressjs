// ============================================
// TYPES — Dominio: Mercado Campesino
// ============================================
export interface Product {
  id: number;
  name: string;
  category: 'verduras' | 'frutas' | 'lacteos' | 'granos';
  price: number;
  stock: number;
  unit: string; // ej: kg, unidad, litro, docena
  createdAt: string;
}

// DTO para crear — sin campos auto-generados
export type CreateProductDto = Omit<Product, 'id' | 'createdAt'>;

// DTO para actualizar — todos los campos opcionales
export type UpdateProductDto = Partial<CreateProductDto>;

// Contratos de respuesta (no cambiar nombres — son genéricos)
export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
