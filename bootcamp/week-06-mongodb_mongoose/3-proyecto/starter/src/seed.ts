// src/seed.ts - Datos iniciales (mercado campesino)
// Ejecutar con: pnpm seed
// Regla: se inserta primero la entidad SECUNDARIA (Category) y luego la PRINCIPAL (Product)

import 'dotenv/config';
import { connectDB, disconnectDB } from './lib/mongoose';
import { Category, type CategoryName } from './models/secondary.model';
import { Product } from './models/primary.model';

async function seed(): Promise<void> {
  await connectDB();
  console.log('Iniciando seed...');

  // Idempotente: primero se borra el hijo (Product) y luego el padre (Category)
  await Product.deleteMany({});
  await Category.deleteMany({});

  const categories = await Category.insertMany([
    { name: 'verduras', description: 'Hortalizas frescas de la huerta' },
    { name: 'frutas', description: 'Frutas de cosecha regional' },
    { name: 'lacteos', description: 'Leche y derivados de finca' },
    { name: 'granos', description: 'Granos secos y cereales' },
    { name: 'tuberculos', description: 'Papas, yuca y arracacha' },
  ]);
  console.log(`${categories.length} categorias creadas`);

  const idOf = (name: CategoryName) => {
    const category = categories.find((c) => c.name === name);
    if (!category) throw new Error(`Categoria no encontrada: ${name}`);
    return category._id;
  };

  const products = await Product.insertMany([
    { name: 'Tomate chonto', sku: 'VER-001', price: 3500, stock: 120, unit: 'kg', farmer: 'Finca La Esperanza', category: idOf('verduras') },
    { name: 'Cebolla cabezona', sku: 'VER-002', price: 2800, stock: 200, unit: 'kg', farmer: 'Vereda El Rosal', category: idOf('verduras') },
    { name: 'Cilantro', sku: 'VER-003', price: 1000, stock: 60, unit: 'atado', farmer: 'Huerta Dona Rosa', category: idOf('verduras') },
    { name: 'Mango tommy', sku: 'FRU-001', price: 4200, stock: 80, unit: 'kg', farmer: 'Finca El Mango', category: idOf('frutas') },
    { name: 'Banano criollo', sku: 'FRU-002', price: 2200, stock: 150, unit: 'kg', farmer: 'Finca La Esperanza', category: idOf('frutas') },
    { name: 'Leche entera', sku: 'LAC-001', price: 3800, stock: 40, unit: 'litro', farmer: 'Lecheria San Isidro', category: idOf('lacteos') },
    { name: 'Queso campesino', sku: 'LAC-002', price: 16000, stock: 25, unit: 'kg', farmer: 'Lecheria San Isidro', category: idOf('lacteos') },
    { name: 'Frijol cargamanto', sku: 'GRA-001', price: 7500, stock: 60, unit: 'kg', farmer: 'Vereda La Palma', category: idOf('granos') },
    { name: 'Papa criolla', sku: 'TUB-001', price: 2800, stock: 90, unit: 'kg', farmer: 'Vereda El Rosal', category: idOf('tuberculos') },
    { name: 'Yuca', sku: 'TUB-002', price: 1900, stock: 70, unit: 'kg', farmer: 'Finca El Mango', category: idOf('tuberculos') },
  ]);
  console.log(`${products.length} productos creados`);

  await disconnectDB();
  console.log('Seed completado');
}

seed().catch(async (err: unknown) => {
  console.error('Error en seed:', err);
  await disconnectDB();
  process.exit(1);
});
