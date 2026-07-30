// ============================================
// ENTRY POINT — Orquesta todo el flujo
// ============================================

import { readItems } from './reader.js';
import { filterByCategory, calculateSummary } from './processor.js';
import { writeReport } from './writer.js';
import type { Report } from './types.js';

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const categoryIndex = args.indexOf('--category');
    const categoryFilter: string | null =
      categoryIndex !== -1 ? args[categoryIndex + 1] : null;

    const allItems = await readItems();
    const filteredItems = filterByCategory(allItems, categoryFilter);
    const summary = calculateSummary(filteredItems);

    const report: Report = {
      generatedAt: new Date().toISOString(),
      appliedFilter: categoryFilter,
      summary,
      items: filteredItems,
    };

    console.log('--- Resumen del catálogo ---');
    console.log(`Total: ${summary.total}`);
    console.log(`Activos: ${summary.active}`);
    console.log(`Inactivos: ${summary.inactive}`);
    console.log(`Precio promedio: ${summary.averagePrice}`);
    console.log(`Más caro: ${summary.mostExpensive.name} ($${summary.mostExpensive.price})`);
    console.log(`Más barato: ${summary.cheapest.name} ($${summary.cheapest.price})`);
    console.log(`Categorías: ${summary.categories.join(', ')}`);

    await writeReport(report);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();