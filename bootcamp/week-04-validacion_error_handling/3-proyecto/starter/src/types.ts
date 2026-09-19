// ============================================
// TYPES - Product (mercado campesino)
// ============================================

export type Category = 'verduras' | 'frutas' | 'lacteos' | 'granos';

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  stock: number;
  unit: string;
  createdAt: Date;
}

export interface SingleResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ValidationErrorResponse {
  error: string;
  message: string;
  issues: Array<{ field: string; message: string }>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  stack?: string;
}
