// src/seed.ts - Crea el administrador del mercado, una vendedora y productos de ejemplo
// Ejecutar con: pnpm seed
// Las credenciales se leen de .env (SEED_*): no hay contraseñas escritas en el codigo.
import 'dotenv/config';
import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from './lib/mongoose.js';
import { User } from './models/user.model.js';
import { Product } from './models/item.model.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name} en .env`);
  return value;
}

async function seed(): Promise<void> {
  const adminEmail = requireEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const sellerEmail = requireEnv('SEED_SELLER_EMAIL').toLowerCase();
  const [adminHash, sellerHash] = await Promise.all([
    bcrypt.hash(requireEnv('SEED_ADMIN_PASSWORD'), 12),
    bcrypt.hash(requireEnv('SEED_SELLER_PASSWORD'), 12),
  ]);

  await connectDB();
  console.log('Iniciando seed...');

  // Idempotente: se borran los productos y los dos usuarios del seed, y se vuelven a crear
  await Product.deleteMany({});
  await User.deleteMany({ email: { $in: [adminEmail, sellerEmail] } });

  const [admin, seller] = await User.insertMany([
    { name: 'Administracion Mercado', email: adminEmail, password: adminHash, role: 'admin' },
    { name: 'Dona Rosa', email: sellerEmail, password: sellerHash, role: 'user' },
  ]);
  console.log(`Usuarios: ${adminEmail} (admin) | ${sellerEmail} (vendedora)`);

  const products = await Product.insertMany([
    { name: 'Tomate chonto', sku: 'VER-001', category: 'verduras', price: 3500, stock: 120, unit: 'kg', farmer: 'Finca La Esperanza', createdBy: seller._id },
    { name: 'Cilantro', sku: 'VER-003', category: 'verduras', price: 1000, stock: 60, unit: 'atado', farmer: 'Huerta Dona Rosa', createdBy: seller._id },
    { name: 'Mango tommy', sku: 'FRU-001', category: 'frutas', price: 4200, stock: 80, unit: 'kg', farmer: 'Finca El Mango', createdBy: seller._id },
    { name: 'Queso campesino', sku: 'LAC-002', category: 'lacteos', price: 16000, stock: 25, unit: 'kg', farmer: 'Lecheria San Isidro', createdBy: admin._id },
    { name: 'Frijol cargamanto', sku: 'GRA-001', category: 'granos', price: 7500, stock: 60, unit: 'kg', farmer: 'Vereda La Palma', createdBy: admin._id },
    { name: 'Papa criolla', sku: 'TUB-001', category: 'tuberculos', price: 2800, stock: 90, unit: 'kg', farmer: 'Vereda El Rosal', createdBy: seller._id },
  ]);
  console.log(`${products.length} productos creados`);

  await disconnectDB();
  console.log('Seed completado');
}

seed().catch(async (err: unknown) => {
  console.error('Error en seed:', err instanceof Error ? err.message : err);
  await disconnectDB();
  process.exit(1);
});
