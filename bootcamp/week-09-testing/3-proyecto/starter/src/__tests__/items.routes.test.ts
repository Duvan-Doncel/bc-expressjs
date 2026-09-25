// ============================================================
// INTEGRATION TESTS — /api/v1/products (mercado campesino)
// ============================================================
// Ciclo HTTP completo con Supertest + MongoDB Memory Server.
// ============================================================

import request from 'supertest';
import { Types } from 'mongoose';
import { app } from '../app';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db';
import { createSeller, createAdmin, OTHER_SELLER } from './helpers/auth';

const BASE = '/api/v1/products';

const papaCriolla = {
  name: 'Papa criolla',
  sku: 'tub-001',
  category: 'tuberculos',
  price: 2800,
  stock: 90,
  farmer: 'Vereda El Rosal',
};

let sellerToken: string;

beforeAll(async () => {
  await connectTestDB();
});

beforeEach(async () => {
  sellerToken = await createSeller();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

async function createProduct(body: Record<string, unknown> = papaCriolla, token = sellerToken): Promise<string> {
  const res = await request(app).post(BASE).set('Authorization', `Bearer ${token}`).send(body);
  return res.body.data._id as string;
}

describe('Products Routes — Integration Tests', () => {
  describe('GET /api/v1/products', () => {
    it('devuelve 200 con array vacio inicialmente (ruta publica)', async () => {
      const res = await request(app).get(BASE);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: [], total: 0, page: 1, totalPages: 0 });
    });

    it('filtra por categoria y pagina los resultados', async () => {
      await createProduct();
      await createProduct({ name: 'Yuca', sku: 'TUB-002', category: 'tuberculos', price: 1900 });
      await createProduct({ name: 'Queso campesino', sku: 'LAC-002', category: 'lacteos', price: 16000 });

      const res = await request(app).get(`${BASE}?category=tuberculos&limit=1&page=2`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.totalPages).toBe(2);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].category).toBe('tuberculos');
    });

    it('busca por nombre sin distinguir mayusculas', async () => {
      await createProduct();
      await createProduct({ name: 'Queso campesino', sku: 'LAC-002', category: 'lacteos', price: 16000 });

      const res = await request(app).get(`${BASE}?search=QUESO`);

      expect(res.body.total).toBe(1);
      expect(res.body.data[0].name).toBe('Queso campesino');
    });

    it('filtra por disponibilidad (productos agotados fuera del puesto)', async () => {
      await createProduct();
      await createProduct({ name: 'Mango tommy', sku: 'FRU-001', category: 'frutas', price: 4200, available: false });

      const available = await request(app).get(`${BASE}?available=true`);
      const soldOut = await request(app).get(`${BASE}?available=false`);

      expect(available.body.data.map((p: { name: string }) => p.name)).toEqual(['Papa criolla']);
      expect(soldOut.body.data.map((p: { name: string }) => p.name)).toEqual(['Mango tommy']);
    });
  });

  describe('POST /api/v1/products', () => {
    it('devuelve 201 con datos validos y token', async () => {
      const res = await request(app).post(BASE).set('Authorization', `Bearer ${sellerToken}`).send(papaCriolla);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Papa criolla',
        sku: 'TUB-001',
        price: 2800,
        unit: 'kg',
        available: true,
      });
      expect(Types.ObjectId.isValid(res.body.data.createdBy)).toBe(true);
    });

    it('devuelve 422 con datos invalidos (Zod)', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'P', sku: '!', category: 'carnes', price: 10 });

      expect(res.status).toBe(422);
      expect(Object.keys(res.body.details)).toEqual(expect.arrayContaining(['name', 'sku', 'category', 'price']));
    });

    it('devuelve 422 si el cliente intenta fijar createdBy', async () => {
      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ ...papaCriolla, createdBy: new Types.ObjectId().toString() });

      expect(res.status).toBe(422);
    });

    it('devuelve 401 sin token', async () => {
      const res = await request(app).post(BASE).send(papaCriolla);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Autenticacion requerida');
    });

    it('devuelve 401 con un token invalido', async () => {
      const res = await request(app).post(BASE).set('Authorization', 'Bearer token.falso.123').send(papaCriolla);

      expect(res.status).toBe(401);
    });

    it('devuelve 409 si el sku ya existe', async () => {
      await createProduct();

      const res = await request(app)
        .post(BASE)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ ...papaCriolla, name: 'Otra papa', sku: 'TUB-001' });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('devuelve 200 con un producto existente', async () => {
      const id = await createProduct();

      const res = await request(app).get(`${BASE}/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(id);
      expect(res.body.data.farmer).toBe('Vereda El Rosal');
    });

    it('devuelve 404 con un ID inexistente', async () => {
      const res = await request(app).get(`${BASE}/${new Types.ObjectId().toString()}`);

      expect(res.status).toBe(404);
    });

    it('devuelve 422 con un ID que no es ObjectId', async () => {
      const res = await request(app).get(`${BASE}/abc123`);

      expect(res.status).toBe(422);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('devuelve 200 cuando el dueño actualiza el precio', async () => {
      const id = await createProduct();

      const res = await request(app)
        .put(`${BASE}/${id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ price: 3000, stock: 80 });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ price: 3000, stock: 80 });
    });

    it('devuelve 403 cuando otro vendedor intenta editarlo', async () => {
      const id = await createProduct();
      const otherToken = await createSeller(OTHER_SELLER);

      const res = await request(app).put(`${BASE}/${id}`).set('Authorization', `Bearer ${otherToken}`).send({ price: 100 });

      expect(res.status).toBe(403);
    });

    it('devuelve 200 cuando el admin edita el producto de un vendedor', async () => {
      const id = await createProduct();
      const adminToken = await createAdmin();

      const res = await request(app).put(`${BASE}/${id}`).set('Authorization', `Bearer ${adminToken}`).send({ available: false });

      expect(res.status).toBe(200);
      expect(res.body.data.available).toBe(false);
    });

    it('devuelve 422 con un body vacio', async () => {
      const id = await createProduct();

      const res = await request(app).put(`${BASE}/${id}`).set('Authorization', `Bearer ${sellerToken}`).send({});

      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/v1/products/:id/sell', () => {
    it('descuenta el stock al registrar una venta', async () => {
      const id = await createProduct();

      const res = await request(app).post(`${BASE}/${id}/sell`).set('Authorization', `Bearer ${sellerToken}`).send({ quantity: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.stock).toBe(80);
    });

    it('marca el producto como no disponible cuando se agota', async () => {
      const id = await createProduct({ ...papaCriolla, stock: 4 });

      const res = await request(app).post(`${BASE}/${id}/sell`).set('Authorization', `Bearer ${sellerToken}`).send({ quantity: 4 });

      expect(res.body.data).toMatchObject({ stock: 0, available: false });
    });

    it('devuelve 400 si no alcanza el stock', async () => {
      const id = await createProduct({ ...papaCriolla, stock: 2 });

      const res = await request(app).post(`${BASE}/${id}/sell`).set('Authorization', `Bearer ${sellerToken}`).send({ quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Stock insuficiente: quedan 2 kg de Papa criolla');
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('devuelve 403 si no es admin (aunque sea el dueño)', async () => {
      const id = await createProduct();

      const res = await request(app).delete(`${BASE}/${id}`).set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(403);
      const stillThere = await request(app).get(`${BASE}/${id}`);
      expect(stillThere.status).toBe(200);
    });

    it('devuelve 204 cuando el admin elimina el producto', async () => {
      const id = await createProduct();
      const adminToken = await createAdmin();

      const res = await request(app).delete(`${BASE}/${id}`).set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
      const gone = await request(app).get(`${BASE}/${id}`);
      expect(gone.status).toBe(404);
    });

    it('devuelve 404 si el admin elimina un producto inexistente', async () => {
      const adminToken = await createAdmin();

      const res = await request(app)
        .delete(`${BASE}/${new Types.ObjectId().toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('devuelve 401 sin token', async () => {
      const id = await createProduct();

      const res = await request(app).delete(`${BASE}/${id}`);

      expect(res.status).toBe(401);
    });
  });
});
