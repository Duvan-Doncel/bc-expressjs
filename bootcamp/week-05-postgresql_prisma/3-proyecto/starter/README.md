# Semana 05 — API con PostgreSQL y Prisma ORM

## Dominio

**Mercado campesino**. Recurso principal: **Product** (producto agrícola). Recurso secundario: **Category** (verduras, frutas, lácteos y granos), con relación 1:N: una categoría tiene muchos productos y cada producto pertenece a una categoría.

API REST con Express 5 + TypeScript, arquitectura en capas (routes → controllers → services → repositories), PostgreSQL 16 en Docker y Prisma ORM 6.

## Diagrama de entidades

    Category (1) ────────< (N) Product

    Category                  Product
    ----------------          ------------------------------
    id         Int  PK        id          Int  PK
    name       String UNIQUE  name        String
    createdAt  DateTime       sku         String UNIQUE
    updatedAt  DateTime       price       Float
                              stock       Int (default 0)
                              unit        String (default "kg")
                              available   Boolean (default true)
                              categoryId  Int  FK -> Category.id
                              createdAt   DateTime
                              updatedAt   DateTime

## Endpoints

Base: `/api/v1/products`

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| GET | `/api/v1/products?page=1&limit=10` | Listado paginado (incluye la categoría) | 200 |
| GET | `/api/v1/products/:id` | Detalle con su categoría | 200 / 400 / 404 |
| POST | `/api/v1/products` | Crear (validado con Zod) | 201 / 400 / 409 |
| PUT | `/api/v1/products/:id` | Actualizar (campos opcionales) | 200 / 400 / 404 |
| DELETE | `/api/v1/products/:id` | Eliminar | 204 / 404 |
| GET | `/health` | Estado del servidor | 200 |

### Ejemplo: crear producto

Request `POST /api/v1/products`:

    {"name":"Papa criolla","sku":"VER-003","price":2800,"stock":50,"unit":"kg","categoryId":5}

Response 201:

    {"data":{"id":17,"name":"Papa criolla","sku":"VER-003","price":2800,"stock":50,"unit":"kg","available":true,"categoryId":5,"category":{"id":5,"name":"verduras"}}}

### Ejemplo: listado paginado

Response de `GET /api/v1/products?page=1&limit=3`:

    {"data":[ ... 3 productos con su category ... ],"total":8,"page":1,"limit":3}

## Manejo de errores

| Error | Respuesta |
|-------|-----------|
| Body inválido (Zod) | 400 con `issues[]` (campo y mensaje) |
| `:id` no numérico | 400 |
| Prisma `P2002` (sku duplicado) | 409 `Ya existe un registro con ese valor` |
| Prisma `P2025` (registro no existe en update/delete) | 404 `Recurso no encontrado` |
| Prisma `P2003` (categoryId inexistente) | 400 `La categoria indicada no existe` |
| Producto no encontrado en GET | 404 |
| Ruta inexistente | 404 en JSON |

Ejemplo 409:

    {"error":"Application Error","message":"Ya existe un registro con ese valor"}

## Cómo ejecutar

    docker compose up -d
    pnpm install
    copy .env.example .env
    pnpm exec prisma migrate dev --name init
    pnpm exec prisma db seed
    pnpm dev

El servidor queda en `http://localhost:3000`. La base de datos corre en el puerto **5434** del equipo (el 5432 lo ocupaba otro PostgreSQL local). La `DATABASE_URL` vive en `.env`, que no se sube al repositorio.

## Logs del seed

    Iniciando seed...
    4 categorias creadas
    8 productos creados

    The seed command has been executed.

El seed es idempotente: borra los productos y las categorías y los vuelve a crear, así que se puede ejecutar varias veces sin duplicar datos (segunda ejecución con el mismo resultado: 4 categorías y 8 productos).