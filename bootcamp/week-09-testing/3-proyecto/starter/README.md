# Semana 09 — Testing de la API (mercado campesino)

## Dominio

**Mercado campesino**. El recurso principal es **Product**: el catálogo del puesto (verduras, frutas, lácteos, granos y tubérculos) con precios en COP. La suite prueba las reglas de negocio del puesto: el sku es único, el vendedor solo edita sus productos, solo el administrador elimina, y una venta descuenta stock sin dejarlo negativo.

Stack de testing: Jest 29 + ts-jest, Supertest y MongoDB Memory Server.

## Mi implementación

- **Recurso del dominio:** el `Item` genérico pasó a ser `Product` (`ProductModel`, colección `products`, ruta `/api/v1/products`), con los mismos campos y validaciones de las semanas 06 a 08: `sku` único, `price` entre 50 y 5.000.000 COP, `category` y `unit` como enum, `farmer` y `createdBy`. Los archivos conservan los nombres del starter (`items.*`), porque el README de esta semana nombra así los archivos de test (`items.service.test.ts`, `items.routes.test.ts`).
- **Reglas del puesto que se testean:**
  - `create()` → 409 si el sku ya existe (el sku se normaliza a mayúsculas).
  - `update()` → 403 si otro vendedor intenta editar; el admin puede editar cualquiera; 409 si el nuevo sku ya pertenece a otro producto.
  - `sell()` (nuevo, `POST /products/:id/sell`) → descuenta el stock de forma atómica (`$inc` con la condición `stock >= quantity`). Responde 400 si no alcanza (`Stock insuficiente: quedan 2 kg de Papa criolla`), 409 si otra venta se llevó el stock al mismo tiempo, y deja el producto `available: false` cuando se agota.
  - `remove()` → solo admin (`authorize('admin')` en la ruta); un vendedor recibe 403 aunque sea el dueño.
- **Qué manda el README de esta semana sobre las anteriores:** los errores de Zod responden **422** (antes eran 400), la actualización es **`PUT`** (parcial) y el login devuelve `accessToken` en el body para usarlo como `Authorization: Bearer`, tal como lo trae el starter y lo pide la rúbrica.
- **Correcciones al starter:**
  - Nadie cargaba `.env.test` en Jest, y `config/env.ts` usaba `'change-me'` como secreto por defecto. Ahora `src/__tests__/setup/load-env.ts` (en `setupFiles`) carga `.env.test`, y `env.ts` exige un secreto de al menos 32 caracteres, sin valor por defecto.
  - Los imports con extensión `.js` no resolvían en Jest; lo arreglé con `moduleNameMapper` en `jest.config.ts`.
  - `pnpm dev` fallaba (`Cannot find module './app.js'` con ts-node-dev). Ahora usa `tsx watch`, como las semanas 05 a 08.
  - El login no pedía la contraseña explícitamente. Ahora `password` es `select: false`, `createUser` devuelve el usuario sin la contraseña y el error de login es el mismo para email inexistente y contraseña incorrecta.
  - El error handler agrupa los errores 422 por campo (`details.price`, `details.sku`…), no bajo `body`.

## Tests

| Archivo | Tipo | Qué prueba |
|---------|------|------------|
| `src/__tests__/items.service.test.ts` | Unit (`jest.mock` del repositorio) | `getAll` (paginación y filtros), `getById` (200/404), `create` (ok/409), `update` (dueño, admin, 403, 404, 409), `sell` (descuento, agotado, 400, 409, 404), `remove` (ok/404) |
| `src/__tests__/auth.service.test.ts` | Unit (`jest.mock` del repositorio, bcrypt y jwt) | `register` (ok/409), `login` (ok, 401 por contraseña, 401 idéntico por email), `getMe` (ok/404) |
| `src/__tests__/items.routes.test.ts` | Integración (Supertest + MongoDB Memory Server) | GET 200 vacío, filtros y paginación; POST 201/422/401/409; GET `:id` 200/404/422; PUT 200 (dueño y admin)/403/422; venta; DELETE 403 (no admin)/204 (admin)/404/401 |
| `src/__tests__/auth.routes.test.ts` | Integración | register 201 (password hasheada)/409/422, login 200 con `accessToken`/401, `me` 200/401/401 expirado/404, Helmet, 404 de ruta, JSON mal formado |

Aislamiento y limpieza:
- `clearMocks: true` en `jest.config.ts` limpia los mocks entre tests.
- Los tests de integración usan `beforeAll` (levanta MongoDB Memory Server), `afterEach` (vacía todas las colecciones) y `afterAll` (desconecta y detiene el servidor). Los helpers están en `src/__tests__/helpers/`.
- El admin se crea directo en la BD, porque el registro público no permite elegir el rol. Los vendedores se crean por la API.
- Ningún test usa una base de datos real.

Resultado (`pnpm test:coverage`):

    Test Suites: 4 passed, 4 total
    Tests:       64 passed, 64 total

    All files  | % Stmts 96.67 | % Branch 81.48 | % Funcs 100 | % Lines 97.14

Umbrales configurados en `jest.config.ts`: statements 80%, branches 70%, functions 80% y lines 80%.

## Cómo ejecutar los tests

    pnpm install          # descarga una vez el binario de MongoDB para MongoDB Memory Server (~600 MB)
    pnpm test             # todos los tests
    pnpm test:watch       # modo watch
    pnpm test:coverage    # reporte de cobertura -> coverage/lcov-report/index.html

No se necesita Docker ni una base de datos real: MongoDB Memory Server levanta un `mongod` temporal por archivo de test. El `pnpm-workspace.yaml` autoriza los scripts de instalación de `bcrypt` y `mongodb-memory-server` (pnpm 10 los bloquea por defecto).

## Cómo ejecutar la API

    copy .env.example .env    # define JWT_ACCESS_SECRET (≥ 32 caracteres) y MONGODB_URI
    pnpm dev

## Endpoints

| Método | Ruta | Acceso | Status |
|--------|------|--------|--------|
| POST | `/api/v1/auth/register` | Público | 201 / 409 / 422 |
| POST | `/api/v1/auth/login` | Público | 200 / 401 / 422 |
| GET | `/api/v1/auth/me` | Bearer | 200 / 401 / 404 |
| GET | `/api/v1/products?page&limit&category&search&available` | Público | 200 |
| GET | `/api/v1/products/:id` | Público | 200 / 404 / 422 |
| POST | `/api/v1/products` | Bearer | 201 / 401 / 409 / 422 |
| PUT | `/api/v1/products/:id` | Bearer (dueño o admin) | 200 / 401 / 403 / 404 / 409 / 422 |
| POST | `/api/v1/products/:id/sell` | Bearer | 200 / 400 / 401 / 404 / 409 / 422 |
| DELETE | `/api/v1/products/:id` | Bearer + admin | 204 / 401 / 403 / 404 |
| GET | `/api/v1/health` | Público | 200 |
