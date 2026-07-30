// ============================================
// TIPOS — Dominio: Mercado Campesino
// ============================================
// Recurso principal: Product (producto agrícola del mercado campesino)

export interface Product {
  id: string;
  name: string;
  category: string; // verduras, frutas, lacteos, granos, etc.
  price: number;
  stock: number;
  active: boolean;
}

// Resumen que el procesador debe calcular
export interface ProductSummary {
  total: number;
  active: number;
  inactive: number;
  averagePrice: number;
  mostExpensive: Product;
  cheapest: Product;
  categories: string[];
}

// Reporte final que se escribirá en output/report.json
export interface Report {
  generatedAt: string;
  appliedFilter: string | null;
  summary: ProductSummary;
  items: Product[];
}