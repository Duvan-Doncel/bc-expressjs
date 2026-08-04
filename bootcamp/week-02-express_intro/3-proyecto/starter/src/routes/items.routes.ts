import { Router } from 'express';
import * as store from '../store.js';
import type { CreateProductDto, UpdateProductDto } from '../types.js';

export const productsRouter = Router();

// GET /products — Listar todos los productos
productsRouter.get('/', (_req, res) => {
  res.json(store.getAll());
});

// GET /products/:id — Obtener producto por ID
productsRouter.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = store.getById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST /products — Crear nuevo producto
productsRouter.post('/', (req, res) => {
  const dto: CreateProductDto = req.body;
  const newProduct = store.create(dto);
  res.status(201).json(newProduct);
});

// PUT /products/:id — Actualizar producto completo
productsRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const dto: UpdateProductDto = req.body;
  const updated = store.update(id, dto);
  if (!updated) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(updated);
});

// DELETE /products/:id — Eliminar producto
productsRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const deleted = store.remove(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.status(204).send();
});