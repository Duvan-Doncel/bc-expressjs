// prisma/seed.ts - Datos iniciales (mercado campesino)
// Ejecutar con: pnpm exec prisma db seed

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  // Idempotente: primero se borra el hijo (Product) y luego el padre (Category)
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const categoryIds = new Map<string, number>();
  for (const name of ['verduras', 'frutas', 'lacteos', 'granos']) {
    const category = await prisma.category.create({ data: { name } });
    categoryIds.set(name, category.id);
  }
  console.log(`${categoryIds.size} categorias creadas`);

  function idOf(name: string): number {
    const id = categoryIds.get(name);
    if (id === undefined) throw new Error(`Categoria no encontrada: ${name}`);
    return id;
  }

  const result = await prisma.product.createMany({
    data: [
      { name: 'Tomate chonto', sku: 'VER-001', price: 3500, stock: 120, unit: 'kg', categoryId: idOf('verduras') },
      { name: 'Cebolla cabezona', sku: 'VER-002', price: 2800, stock: 200, unit: 'kg', categoryId: idOf('verduras') },
      { name: 'Mango tommy', sku: 'FRU-001', price: 4200, stock: 80, unit: 'kg', categoryId: idOf('frutas') },
      { name: 'Banano criollo', sku: 'FRU-002', price: 2200, stock: 150, unit: 'kg', categoryId: idOf('frutas') },
      { name: 'Leche entera', sku: 'LAC-001', price: 3800, stock: 40, unit: 'litro', categoryId: idOf('lacteos') },
      { name: 'Queso campesino', sku: 'LAC-002', price: 16000, stock: 25, unit: 'kg', categoryId: idOf('lacteos') },
      { name: 'Frijol cargamanto', sku: 'GRA-001', price: 7500, stock: 60, unit: 'kg', categoryId: idOf('granos') },
      { name: 'Arroz de la region', sku: 'GRA-002', price: 4100, stock: 90, unit: 'kg', categoryId: idOf('granos') },
    ],
  });
  console.log(`${result.count} productos creados`);
}

main()
  .catch((err: unknown) => {
    console.error('Error en seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });