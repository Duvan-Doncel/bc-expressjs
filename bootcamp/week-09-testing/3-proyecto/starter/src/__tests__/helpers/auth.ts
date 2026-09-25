// Crea usuarios del mercado y devuelve su token Bearer para los integration tests
import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../app';
import { UserModel } from '../../models/user.model';

export const SELLER = { name: 'Dona Rosa', email: 'dona.rosa@mercado.co', password: 'Campesina2026' };
export const OTHER_SELLER = { name: 'Don Carlos', email: 'carlos@mercado.co', password: 'Vereda2026' };
export const ADMIN = { name: 'Administracion Mercado', email: 'admin@mercado.co', password: 'AdminMercado2026' };

export async function loginAs(credentials: { email: string; password: string }): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send(credentials);
  return res.body.accessToken as string;
}

// Vendedor: se registra por la API publica (siempre queda con rol 'user')
export async function createSeller(seller = SELLER): Promise<string> {
  await request(app).post('/api/v1/auth/register').send(seller);
  return loginAs(seller);
}

// Admin: el registro publico no permite elegir rol, asi que se inserta directo en la BD
export async function createAdmin(): Promise<string> {
  const password = await bcrypt.hash(ADMIN.password, 4);
  await UserModel.create({ ...ADMIN, password, role: 'admin' });
  return loginAs(ADMIN);
}
