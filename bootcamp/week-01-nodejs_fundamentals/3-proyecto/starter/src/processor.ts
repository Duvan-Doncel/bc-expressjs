// ============================================
// PROCESSOR — Filtra y calcula estadísticas
// ============================================
import type { Product, ProductSummary } from './types.js';

export function filterByCategory(
  items: Product[],
  categoryFilter: string | null
): Product[] {
  if (categoryFilter === null) {
    return items;
  }

  const filtered = items.filter(
    (item) => item.category.toLowerCase() === categoryFilter.toLowerCase()
  );

  if (filtered.length === 0) {
    const availableCategories = Array.from(
      new Set(items.map((item) => item.category))
    );
    throw new Error(
      `No hay productos en la categoría "${categoryFilter}". Categorías disponibles: ${availableCategories.join(', ')}`
    );
  }

  return filtered;
}

export function calculateSummary(items: Product[]): ProductSummary {
  const total = items.length;
  const active = items.filter((item) => item.active).length;
  const inactive = total - active;

  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
  const averagePrice = Math.round((totalPrice / total) * 100) / 100;

  const mostExpensive = items.reduce((max, item) =>
    item.price > max.price ? item : max
  );
  const cheapest = items.reduce((min, item) =>
    item.price < min.price ? item : min
  );

  const categories = Array.from(new Set(items.map((item) => item.category)));

  return {
    total,
    active,
    inactive,
    averagePrice,
    mostExpensive,
    cheapest,
    categories,
  };
}