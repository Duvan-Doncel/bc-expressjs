# Semana 06 — API con MongoDB y Mongoose

## Dominio

**Mercado campesino**. Recurso principal: **Product** (producto del puesto de mercado, con precio en COP). Recurso secundario: **Category** (verduras, frutas, lácteos, granos y tubérculos). Cada producto guarda una **referencia** (`ObjectId`) a su categoría, y la API la devuelve como objeto completo usando `populate()`.

API REST con Express 5 + TypeScript, arquitectura en capas (routes → controllers → services → repositories), MongoDB 7 en Docker y Mongoose 9.

## Mi implementación

Esta semana migré la API de la semana 05 (PostgreSQL + Prisma) a MongoDB con Mongoose, manteniendo el mismo dominio y los mismos datos de ejemplo:

- **Entidades del dominio:** la entidad secundaria del starter pasó a ser `Category` (colección `categories`) y la principal pasó a ser `Product` (colección `products`). El campo de referencia es `category: ObjectId` con `ref: 'Category'`. Los archivos conservan los nombres del starter (`primary.*` y `secondary.*`), igual que en la semana 05 se conservaron los `items.*`.
- **Categorías:** a las cuatro categorías de la semana 05 (`verduras`, `frutas`, `lacteos`, `granos`) les agregué `tuberculos` (papa criolla, yuca). El nombre está limitado con `enum` y es `unique`.
- **Productos:** mantienen los campos de la semana 05 (`name`, `sku` único, `price` en COP, `stock`, `unit`, `available`) y agregan `farmer` (la finca o vereda de donde viene el producto). `unit` ahora es un `enum` con las unidades reales del mercado: `kg`, `libra`, `litro`, `unidad`, `atado` (por ejemplo, cilantro) y `docena`.
- **Precios en COP:** el precio va entre 50 y 5.000.000 COP. Esa regla se valida en dos capas: en Zod (400 con `issues[]`) y en el Schema de Mongoose (`min`/`max`).
- **Reglas de negocio del puesto:** no se puede crear ni mover un producto a una categoría que no existe (400), y no se puede borrar una categoría que todavía tiene productos (409). Así no quedan productos con una categoría huérfana.
- **Continuidad:** reutilicé de las semanas 04 y 05 el `AppError`, el `errorHandler` con el mismo formato de respuesta (`error`, `message`, `issues`) y el logger de Winston.

## Diagrama de entidades

    Category (1) ────────< (N) Product   (referencia: Product.category -> Category._id)

    Category                         Product
    -------------------------        ------------------------------------------
    _id          ObjectId            _id        ObjectId
    name         String UNIQUE       name       String  (required, trim, max 120)
                 enum (5 valores)    sku        String  UNIQUE (uppercase, 3-30)
    description  String (max 300)    price      Number  (COP, min 50, max 5.000.000)
    active       Boolean (true)      stock      Number  (entero, min 0, default 0)
    createdAt    Date                unit       String  enum (default "kg")
    updatedAt    Date                available  Boolean (default true)
                                     farmer     String  (max 100, opcional)
                                     category   ObjectId ref Category (required, index)
                                     createdAt / updatedAt  (timestamps: true)

## Endpoints

### Categorías — `/api/v1/categories`

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| GET | `/api/v1/categories` | Listar todas (orden alfabético) | 200 |
| GET | `/api/v1/categories/:id` | Obtener por id | 200 / 400 / 404 |
| POST | `/api/v1/categories` | Crear | 201 / 400 / 409 |
| PUT | `/api/v1/categories/:id` | Actualizar | 200 / 400 / 404 / 409 |
| DELETE | `/api/v1/categories/:id` | Eliminar (solo si no tiene productos) | 204 / 400 / 404 / 409 |

### Productos — `/api/v1/products`

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| GET | `/api/v1/products?page=1&limit=10&search=papa` | Listado paginado con `populate('category')` y búsqueda por nombre | 200 |
| GET | `/api/v1/products/:id` | Detalle con la categoría populada | 200 / 400 / 404 |
| POST | `/api/v1/products` | Crear (valida que la categoría exista) | 201 / 400 / 409 |
| PUT | `/api/v1/products/:id` | Actualizar (campos opcionales) | 200 / 400 / 404 / 409 |
| DELETE | `/api/v1/products/:id` | Eliminar | 204 / 400 / 404 |
| GET | `/health` | Estado del servidor | 200 |

### Ejemplo: crear producto

Request `POST /api/v1/products`:

    {"name":"Arracacha","sku":"tub-003","price":3200,"stock":30,"farmer":"Vereda La Palma","category":"6ab5fada6334d10f511be61c"}

Response 201 (el sku se guarda en mayúsculas y la categoría viene populada):

    {"data":{"_id":"6ab5faebc1577a9a06f7f8bf","name":"Arracacha","sku":"TUB-003","price":3200,"stock":30,"unit":"kg","available":true,"farmer":"Vereda La Palma","category":{"_id":"6ab5fada6334d10f511be61c","name":"tuberculos","description":"Papas, yuca y arracacha","active":true}, ...}}

### Ejemplo: listado paginado

Response de `GET /api/v1/products?page=2&limit=4`:

    {"data":[ ... 4 productos con su category ... ],"total":10,"page":2,"totalPages":3}

La paginación usa `skip/limit` + `countDocuments()` en paralelo y las lecturas usan `.lean()`.

## Manejo de errores

| Error | Respuesta |
|-------|-----------|
| Body inválido (Zod) | 400 con `issues[]` (campo y mensaje) |
| `:id` que no es un ObjectId (ej. `abc123`) / `CastError` | 400 `ID invalido` |
| `category` con formato inválido | 400 `category debe ser un ID valido` |
| `category` con formato válido pero inexistente | 400 `La categoria indicada no existe` |
| Error `11000` (sku o nombre de categoría duplicado) | 409 `Ya existe un(a) producto con ese sku` |
| Borrar una categoría con productos | 409 `La categoria tiene N producto(s) asociados` |
| `findById` devuelve `null` (el servicio lanza el error) | 404 `Producto <id> no encontrado` |
| `ValidationError` de Mongoose | 400 con el mensaje del validador |
| Ruta inexistente | 404 en JSON |

El repositorio traduce los errores de Mongoose/MongoDB a `AppError` en `src/errors/mongoErrors.ts`, y el servicio convierte los `null` en 404.

## Cómo ejecutar

    docker compose up -d
    pnpm install
    copy .env.example .env
    pnpm seed
    pnpm dev

El servidor queda en `http://localhost:3000`. `MONGODB_URI` se lee desde `.env` (no se sube al repositorio). `mongoose.connect()` se llama una sola vez, en `connectDB()`, antes de `app.listen()` en `server.ts` (y en `seed.ts`).

Compilar: `pnpm build`.

## Logs del seed

    [info] MongoDB connected (mercado_campesino_w06)
    Iniciando seed...
    5 categorias creadas
    10 productos creados
    Seed completado

El seed es idempotente: primero borra los productos y luego las categorías; después inserta las categorías y, con sus `_id`, los productos. Se puede ejecutar varias veces sin duplicar datos.
