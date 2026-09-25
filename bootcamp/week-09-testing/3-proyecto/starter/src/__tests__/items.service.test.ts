// ============================================================
// UNIT TESTS — items.service.ts (productos del mercado campesino)
// ============================================================
// El repositorio se mockea con jest.mock(): no hay base de datos,
// solo se prueba la logica de negocio del servicio.
// ============================================================

import { Types } from 'mongoose';

jest.mock('../repositories/items.repository');

import * as productsRepo from '../repositories/items.repository';
import * as productsService from '../services/items.service';
import { AppError } from '../errors/AppError';
import type { IProduct } from '../models/item.model';
import type { CreateProductDto, ProductQuery } from '../types';

const mockFindAll = productsRepo.findAllProducts as jest.MockedFunction<typeof productsRepo.findAllProducts>;
const mockFindById = productsRepo.findProductById as jest.MockedFunction<typeof productsRepo.findProductById>;
const mockFindBySku = productsRepo.findProductBySku as jest.MockedFunction<typeof productsRepo.findProductBySku>;
const mockCreate = productsRepo.createProduct as jest.MockedFunction<typeof productsRepo.createProduct>;
const mockUpdate = productsRepo.updateProduct as jest.MockedFunction<typeof productsRepo.updateProduct>;
const mockDecrement = productsRepo.decrementStock as jest.MockedFunction<typeof productsRepo.decrementStock>;
const mockSetAvailability = productsRepo.setAvailability as jest.MockedFunction<typeof productsRepo.setAvailability>;
const mockDelete = productsRepo.deleteProduct as jest.MockedFunction<typeof productsRepo.deleteProduct>;

const SELLER_ID = new Types.ObjectId().toString();
const OTHER_SELLER_ID = new Types.ObjectId().toString();
const PRODUCT_ID = new Types.ObjectId().toString();

function buildProduct(overrides: Partial<IProduct> = {}): IProduct {
  return {
    _id: new Types.ObjectId(PRODUCT_ID),
    name: 'Papa criolla',
    sku: 'TUB-001',
    category: 'tuberculos',
    price: 2800,
    stock: 90,
    unit: 'kg',
    available: true,
    farmer: 'Vereda El Rosal',
    createdBy: new Types.ObjectId(SELLER_ID),
    createdAt: new Date('2026-09-20'),
    updatedAt: new Date('2026-09-20'),
    ...overrides,
  };
}

const defaultQuery: ProductQuery = { page: 1, limit: 10 };

describe('ProductsService — Unit Tests', () => {
  describe('getAll()', () => {
    it('devuelve los productos paginados con totalPages', async () => {
      // Arrange
      const products = [buildProduct(), buildProduct({ name: 'Yuca', sku: 'TUB-002', price: 1900 })];
      mockFindAll.mockResolvedValue({ data: products, total: 12 });

      // Act
      const result = await productsService.getAll({ page: 2, limit: 5 });

      // Assert
      expect(mockFindAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
      expect(result).toEqual({ data: products, total: 12, page: 2, totalPages: 3 });
    });

    it('pasa los filtros del dominio (categoria, busqueda y disponibilidad) al repositorio', async () => {
      mockFindAll.mockResolvedValue({ data: [], total: 0 });
      const query: ProductQuery = { page: 1, limit: 10, category: 'lacteos', search: 'queso', available: true };

      const result = await productsService.getAll(query);

      expect(mockFindAll).toHaveBeenCalledWith(query);
      expect(result.data).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getById()', () => {
    it('devuelve el producto cuando existe', async () => {
      const product = buildProduct();
      mockFindById.mockResolvedValue(product);

      const result = await productsService.getById(PRODUCT_ID);

      expect(mockFindById).toHaveBeenCalledWith(PRODUCT_ID);
      expect(result.name).toBe('Papa criolla');
      expect(result.price).toBe(2800);
    });

    it('lanza AppError 404 cuando el producto no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(productsService.getById(PRODUCT_ID)).rejects.toBeInstanceOf(AppError);
      await expect(productsService.getById(PRODUCT_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create()', () => {
    const dto: CreateProductDto = { name: 'Arracacha', sku: 'tub-003', category: 'tuberculos', price: 3200, stock: 30, unit: 'kg', available: true };

    it('crea el producto con el vendedor autenticado como createdBy', async () => {
      mockFindBySku.mockResolvedValue(null);
      const created = buildProduct({ name: 'Arracacha', sku: 'TUB-003', price: 3200, stock: 30 });
      mockCreate.mockResolvedValue(created);

      const result = await productsService.create(dto, SELLER_ID);

      expect(mockFindBySku).toHaveBeenCalledWith('tub-003');
      expect(mockCreate).toHaveBeenCalledWith(dto, SELLER_ID);
      expect(result.sku).toBe('TUB-003');
    });

    it('lanza AppError 409 si ya existe un producto con el mismo sku', async () => {
      mockFindBySku.mockResolvedValue(buildProduct({ sku: 'TUB-003' }));

      await expect(productsService.create(dto, SELLER_ID)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Ya existe un producto con el sku TUB-003',
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    it('actualiza el producto cuando el vendedor es el dueño', async () => {
      mockFindById.mockResolvedValue(buildProduct());
      mockUpdate.mockResolvedValue(buildProduct({ price: 3000 }));

      const result = await productsService.update(PRODUCT_ID, { price: 3000 }, SELLER_ID, 'user');

      expect(mockUpdate).toHaveBeenCalledWith(PRODUCT_ID, { price: 3000 });
      expect(result.price).toBe(3000);
    });

    it('permite al admin actualizar el producto de otro vendedor', async () => {
      mockFindById.mockResolvedValue(buildProduct());
      mockUpdate.mockResolvedValue(buildProduct({ available: false }));

      const result = await productsService.update(PRODUCT_ID, { available: false }, OTHER_SELLER_ID, 'admin');

      expect(result.available).toBe(false);
    });

    it('lanza AppError 403 cuando otro vendedor intenta editar el producto', async () => {
      mockFindById.mockResolvedValue(buildProduct());

      await expect(productsService.update(PRODUCT_ID, { price: 1000 }, OTHER_SELLER_ID, 'user')).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('lanza AppError 404 cuando el producto no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(productsService.update(PRODUCT_ID, { price: 3000 }, SELLER_ID, 'user')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('lanza AppError 409 si el nuevo sku ya pertenece a otro producto', async () => {
      mockFindById.mockResolvedValue(buildProduct());
      mockFindBySku.mockResolvedValue(buildProduct({ sku: 'TUB-002' }));

      await expect(productsService.update(PRODUCT_ID, { sku: 'tub-002' }, SELLER_ID, 'user')).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it('no revisa duplicados si el sku enviado es el mismo del producto', async () => {
      mockFindById.mockResolvedValue(buildProduct());
      mockUpdate.mockResolvedValue(buildProduct());

      await productsService.update(PRODUCT_ID, { sku: 'tub-001' }, SELLER_ID, 'user');

      expect(mockFindBySku).not.toHaveBeenCalled();
    });

    it('lanza AppError 404 si el producto se elimina antes de actualizarlo', async () => {
      mockFindById.mockResolvedValue(buildProduct());
      mockUpdate.mockResolvedValue(null);

      await expect(productsService.update(PRODUCT_ID, { stock: 5 }, SELLER_ID, 'user')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('sell()', () => {
    it('descuenta el stock vendido', async () => {
      mockFindById.mockResolvedValue(buildProduct({ stock: 90 }));
      mockDecrement.mockResolvedValue(buildProduct({ stock: 85 }));

      const result = await productsService.sell(PRODUCT_ID, 5);

      expect(mockDecrement).toHaveBeenCalledWith(PRODUCT_ID, 5);
      expect(result.stock).toBe(85);
      expect(mockSetAvailability).not.toHaveBeenCalled();
    });

    it('marca el producto como no disponible cuando se agota', async () => {
      mockFindById.mockResolvedValue(buildProduct({ stock: 3 }));
      mockDecrement.mockResolvedValue(buildProduct({ stock: 0 }));
      mockSetAvailability.mockResolvedValue(buildProduct({ stock: 0, available: false }));

      const result = await productsService.sell(PRODUCT_ID, 3);

      expect(mockSetAvailability).toHaveBeenCalledWith(PRODUCT_ID, false);
      expect(result).toMatchObject({ stock: 0, available: false });
    });

    it('lanza AppError 400 si no hay stock suficiente', async () => {
      mockFindById.mockResolvedValue(buildProduct({ stock: 2 }));

      await expect(productsService.sell(PRODUCT_ID, 5)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Stock insuficiente: quedan 2 kg de Papa criolla',
      });
      expect(mockDecrement).not.toHaveBeenCalled();
    });

    it('lanza AppError 400 si el producto no esta disponible', async () => {
      mockFindById.mockResolvedValue(buildProduct({ available: false }));

      await expect(productsService.sell(PRODUCT_ID, 1)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('lanza AppError 409 si otra venta se llevo el stock al mismo tiempo', async () => {
      mockFindById.mockResolvedValue(buildProduct({ stock: 5 }));
      mockDecrement.mockResolvedValue(null);

      await expect(productsService.sell(PRODUCT_ID, 5)).rejects.toMatchObject({ statusCode: 409 });
    });

    it('lanza AppError 404 si el producto no existe', async () => {
      mockFindById.mockResolvedValue(null);

      await expect(productsService.sell(PRODUCT_ID, 1)).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('remove()', () => {
    it('elimina el producto', async () => {
      mockDelete.mockResolvedValue(buildProduct());

      await expect(productsService.remove(PRODUCT_ID)).resolves.toBeUndefined();
      expect(mockDelete).toHaveBeenCalledWith(PRODUCT_ID);
    });

    it('lanza AppError 404 cuando el producto no existe', async () => {
      mockDelete.mockResolvedValue(null);

      await expect(productsService.remove(PRODUCT_ID)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
