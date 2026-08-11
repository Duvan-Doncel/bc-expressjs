# API Mercado Campesino — Semana 03: Arquitectura en Capas

## Dominio
Mercado Campesino — venta de productos agrícolas (verduras, frutas, lácteos, granos).

## Arquitectura
API REST en Express 5 + TypeScript, organizada en 4 capas:
`routes → controllers → services → repositories`

- **repository**: único punto de acceso al store en memoria
- **service**: lógica de negocio y paginación, sin dependencias de Express
- **controller**: extrae datos de `req`, llama al service, responde
- **routes**: mapeo de URLs a funciones del controller

## Entidad: Product

| Campo     | Tipo                                          |
|-----------|------------------------------------------------|
| id        | number                                          |
| name      | string                                          |
| category  | 'verduras' \| 'frutas' \| 'lacteos' \| 'granos' |
| price     | number                                          |
| stock     | number                                          |
| unit      | string (kg, unidad, litro, libra...)            |
| createdAt | string (ISO date)                               |

## Endpoints

| Método | Ruta                    | Descripción                          |
|--------|-------------------------|---------------------------------------|
| GET    | /api/v1/products        | Listar con paginación `?page&limit`  |
| GET    | /api/v1/products/:id    | Obtener por id                        |
| POST   | /api/v1/products        | Crear producto                        |
| PUT    | /api/v1/products/:id    | Actualizar producto                   |
| DELETE | /api/v1/products/:id    | Eliminar producto                     |

## Ejemplo — GET /api/v1/products?page=1&limit=3

```json
{
  "data": [
    { "id": 1, "name": "Tomate chonto", "category": "verduras", "price": 3200, "stock": 50, "unit": "kg", "createdAt": "2026-08-11T01:31:17.638Z" }
  ],
  "total": 5,
  "page": 1,
  "limit": 3
}
```

## Ejemplo — error 404

```json
{ "error": "Not Found", "message": "Product 999 not found" }
```

## Cómo correr

```powershell
pnpm install
pnpm dev
```

Servidor en `http://localhost:3000`.
