# Semana 04 — Validación, Errores y Logging

## Dominio

**Mercado campesino**. Recurso principal: **Product** (producto agrícola: verduras, frutas, lácteos y granos).
API REST con Express 5 + TypeScript, arquitectura en 4 capas (routes → controllers → services → repositories) y datos en memoria.

## Campos del schema y validaciones (Zod)

| Campo | Tipo | Validaciones |
|-------|------|--------------|
| `name` | string | Obligatorio, sin espacios sobrantes, no puede estar vacío |
| `category` | enum | Solo `verduras`, `frutas`, `lacteos` o `granos` |
| `price` | number | Obligatorio, mayor a 0 |
| `stock` | number | Entero, no negativo, por defecto `0` |
| `unit` | string | No vacío, por defecto `kg` |

El schema de actualización reutiliza el de creación con `.partial()`. Los tipos (`CreateItemDto`, `UpdateItemDto`) se infieren con `z.infer`. El parámetro `:id` se valida con `z.coerce.number().int().positive()`.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/items?page=1&limit=10` | Listar productos con paginación |
| GET | `/api/v1/items/:id` | Obtener un producto por id |
| POST | `/api/v1/items` | Crear producto (validado con Zod) |
| PUT | `/api/v1/items/:id` | Actualizar producto (campos opcionales) |
| DELETE | `/api/v1/items/:id` | Eliminar producto (204) |
| GET | `/health` | Estado del servidor |

## Manejo de errores

- `ZodError` → 400 con `issues[]` (campo y mensaje)
- `AppError` → su propio `statusCode` (por ejemplo 404 si el producto no existe)
- Error genérico → 500, el stack solo se muestra si `NODE_ENV` no es `production`
- Rutas inexistentes → 404 en JSON (middleware `notFound`)

Ejemplo de 400:

    {"error":"Validation Error","message":"Datos de entrada inválidos","issues":[{"field":"price","message":"price debe ser mayor a 0"}]}

Ejemplo de 404:

    {"error":"Application Error","message":"Producto 999 no encontrado"}

## Logging

Winston con nivel `http` en desarrollo y `warn` en producción (colorizado en dev, JSON en prod, y archivo `logs/error.log` solo en producción). Morgan registra cada petición HTTP a través de Winston.

## Cómo ejecutar

    pnpm install
    pnpm dev

Compilar: `pnpm build`. El servidor queda en `http://localhost:3000`.
