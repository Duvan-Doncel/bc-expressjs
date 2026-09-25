// ============================================================
// INTEGRATION TESTS — /api/v1/auth y comportamiento general de la app
// ============================================================

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { app } from '../app';
import { connectTestDB, clearTestDB, closeTestDB } from './helpers/db';
import { SELLER } from './helpers/auth';
import { UserModel } from '../models/user.model';

const AUTH = '/api/v1/auth';

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Auth Routes — Integration Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('devuelve 201, crea un vendedor y nunca devuelve la contraseña', async () => {
      const res = await request(app).post(`${AUTH}/register`).send(SELLER);

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({ name: 'Dona Rosa', email: 'dona.rosa@mercado.co', role: 'user' });
      expect(res.body.data).not.toHaveProperty('password');

      const stored = await UserModel.findOne({ email: SELLER.email }).select('+password').lean();
      expect(stored?.password).toMatch(/^\$2[aby]\$12\$/); // hash bcrypt, no texto plano
    });

    it('devuelve 409 con email duplicado', async () => {
      await request(app).post(`${AUTH}/register`).send(SELLER);

      const res = await request(app).post(`${AUTH}/register`).send({ ...SELLER, email: 'DONA.ROSA@mercado.co' });

      expect(res.status).toBe(409);
    });

    it('devuelve 422 con contraseña debil o si intenta elegir el rol', async () => {
      const weak = await request(app).post(`${AUTH}/register`).send({ ...SELLER, password: 'debil' });
      const withRole = await request(app).post(`${AUTH}/register`).send({ ...SELLER, role: 'admin' });

      expect(weak.status).toBe(422);
      expect(weak.body.details.password).toBeDefined();
      expect(withRole.status).toBe(422);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post(`${AUTH}/register`).send(SELLER);
    });

    it('devuelve 200 con accessToken en la respuesta', async () => {
      const res = await request(app).post(`${AUTH}/login`).send({ email: SELLER.email, password: SELLER.password });

      expect(res.status).toBe(200);
      expect(typeof res.body.accessToken).toBe('string');
      expect(jwt.decode(res.body.accessToken)).toMatchObject({ role: 'user' });
    });

    it('devuelve 401 con contraseña incorrecta', async () => {
      const res = await request(app).post(`${AUTH}/login`).send({ email: SELLER.email, password: 'Incorrecta2026' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciales invalidas');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('devuelve 200 con token valido en el header Authorization', async () => {
      await request(app).post(`${AUTH}/register`).send(SELLER);
      const login = await request(app).post(`${AUTH}/login`).send({ email: SELLER.email, password: SELLER.password });

      const res = await request(app).get(`${AUTH}/me`).set('Authorization', `Bearer ${login.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(SELLER.email);
    });

    it('devuelve 401 sin token', async () => {
      const res = await request(app).get(`${AUTH}/me`);

      expect(res.status).toBe(401);
    });

    it('devuelve 401 con un token expirado', async () => {
      const expired = jwt.sign(
        { sub: new Types.ObjectId().toString(), role: 'user', exp: Math.floor(Date.now() / 1000) - 60 },
        process.env['JWT_ACCESS_SECRET'] as string,
      );

      const res = await request(app).get(`${AUTH}/me`).set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Token expirado');
    });

    it('devuelve 404 si el usuario del token ya no existe', async () => {
      const orphan = jwt.sign({ sub: new Types.ObjectId().toString(), role: 'user' }, process.env['JWT_ACCESS_SECRET'] as string);

      const res = await request(app).get(`${AUTH}/me`).set('Authorization', `Bearer ${orphan}`);

      expect(res.status).toBe(404);
    });
  });
});

describe('App — comportamiento general', () => {
  it('GET /api/v1/health devuelve 200 con cabeceras de Helmet', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('una ruta inexistente devuelve 404 en JSON', async () => {
    const res = await request(app).get('/api/v1/carnes');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Ruta GET /api/v1/carnes no encontrada');
  });

  it('un JSON mal formado devuelve 400', async () => {
    const res = await request(app).post(`${AUTH}/login`).set('Content-Type', 'application/json').send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON mal formado');
  });
});
