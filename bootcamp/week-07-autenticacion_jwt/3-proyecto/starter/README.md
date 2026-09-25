# Semana 07 — Autenticación JWT (mercado campesino)

## Dominio

**Mercado campesino**. Los usuarios son las personas que atienden el puesto (vendedores) y el administrador del mercado. El recurso protegido es **Product**: los productos del puesto (verduras, frutas, lácteos, granos y tubérculos) con precio en COP. Solo un usuario autenticado puede consultar, registrar, editar o retirar productos.

API REST con Express 5 + TypeScript, MongoDB + Mongoose, bcrypt, JWT (access + refresh) y cookies HttpOnly.

## Mi implementación

- **Recurso del dominio:** el `Resource` genérico del starter pasó a ser `Product` (`ProductModel`, `IProduct`, `createProductSchema`, `productService`…), montado en `/api/v1/products`. Los archivos también se renombraron con `git mv` (`product.model.ts`, `product.schema.ts`, `product.repository.ts`, `product.service.ts`, `product.controller.ts`, `product.routes.ts`), así que ya no queda ningún nombre genérico `resource`.
- **Continuidad con la semana 06:** el producto conserva los mismos campos (`name`, `sku` único, `price` en COP entre 50 y 5.000.000, `stock`, `unit`, `available`, `farmer`) y las mismas validaciones en Zod y en Mongoose. La categoría pasa a ser un `enum` embebido (`verduras`, `frutas`, `lacteos`, `granos`, `tuberculos`), porque esta semana el foco es la autenticación y el README pide un solo recurso principal. También reutilicé el `errorHandler` (con soporte para `ZodError`), la traducción de errores de Mongo (`CastError` → 400, `11000` → 409), el logger de Winston y la paginación `{ data, total, page, totalPages }`.
- **Quién registró cada producto:** cada producto guarda `createdBy` (referencia a `User`), que se toma del token (`req.user.sub`) y nunca del body. La respuesta lo devuelve populado solo con `name` y `email`. Esto prepara la semana 08, donde el vendedor que creó un producto podrá editarlo y solo el administrador podrá eliminarlo.
- **Roles:** `user` (vendedor del puesto, rol por defecto) y `admin` (administrador del mercado). El rol no se puede elegir al registrarse: el body de registro es `.strict()`.

## Sistema de autenticación

| Pieza | Implementación |
|-------|----------------|
| Contraseñas | `bcrypt.hash()` asíncrono con 10 salt rounds; el campo `password` es `select: false` |
| Login | `bcrypt.compare()`; el mismo mensaje `Credenciales inválidas` si el email no existe o la contraseña está mal (sin user enumeration) |
| Access token | JWT HS256 firmado con `JWT_ACCESS_SECRET`, dura **15 min** |
| Refresh token | JWT HS256 firmado con `JWT_REFRESH_SECRET` (distinto), dura **7 días** y lleva un `jti` aleatorio |
| Cookies | `httpOnly`, `secure`, `sameSite: 'strict'`; el `maxAge` de cada cookie es igual a la duración de su token. La cookie del refresh solo viaja a `/api/v1/auth` |
| Refresh en BD | Se guarda **solo el hash**: `bcrypt(sha256(refreshToken))` en `User.refreshToken` (`select: false`) |
| Rotación | Cada `/auth/refresh` emite un par nuevo y reemplaza el hash, así que el refresh anterior deja de servir |
| Detección de reuso | Si llega un refresh viejo (ya rotado), se borra el hash guardado y se cierra la sesión: el usuario debe volver a hacer login |
| Expiración | `authMiddleware` distingue un token expirado (`Token expirado — usa /api/v1/auth/refresh`) de uno inválido; ambos responden 401 |
| Secretos | Solo en `.env`. Al arrancar, `assertJwtConfig()` verifica que existan, que tengan al menos 32 caracteres y que sean **distintos** |

**Por qué `sha256` antes de bcrypt:** bcrypt solo usa los primeros 72 bytes de la entrada. Dos JWT del mismo usuario comparten el header y el inicio del payload, así que `bcrypt.compare(tokenViejo, hashNuevo)` daba `true` y la rotación no invalidaba el token anterior. Al resumir el token completo con SHA-256 (64 caracteres), el hash depende de todo el token. Lo verifiqué: reutilizar el refresh viejo ahora devuelve 401.

## Endpoints

### Auth — `/api/v1/auth`

| Método | Ruta | Acceso | Descripción | Status |
|--------|------|--------|-------------|--------|
| POST | `/register` | Pública | Registro (email, password, name) | 201 / 400 / 409 |
| POST | `/login` | Pública | Emite las cookies `accessToken` y `refreshToken` | 200 / 400 / 401 |
| POST | `/refresh` | Pública (cookie refresh) | Rota los dos tokens | 200 / 401 |
| GET | `/me` | Protegida | Perfil del usuario autenticado (sin password) | 200 / 401 |
| POST | `/logout` | Protegida | Anula el refresh en la BD y limpia las dos cookies | 200 / 401 |

### Productos — `/api/v1/products` (todas protegidas con `authMiddleware`)

| Método | Ruta | Descripción | Status |
|--------|------|-------------|--------|
| GET | `/api/v1/products?page=1&limit=10&search=papa&category=tuberculos` | Listado paginado con filtros | 200 / 401 |
| GET | `/api/v1/products/:id` | Detalle | 200 / 400 / 401 / 404 |
| POST | `/api/v1/products` | Crear (Zod; `createdBy` = usuario del token) | 201 / 400 / 401 / 409 |
| PATCH | `/api/v1/products/:id` | Actualización parcial | 200 / 400 / 401 / 404 / 409 |
| DELETE | `/api/v1/products/:id` | Eliminar | 204 / 400 / 401 / 404 |
| GET | `/health` | Estado del servidor (pública) | 200 |

Ejemplo `POST /api/v1/products`:

    {"name":"Papa criolla","sku":"tub-001","category":"tuberculos","price":2800,"stock":90,"farmer":"Vereda El Rosal"}

Respuesta 201:

    {"data":{"_id":"…","name":"Papa criolla","sku":"TUB-001","category":"tuberculos","price":2800,"stock":90,"unit":"kg","available":true,"farmer":"Vereda El Rosal","createdBy":{"_id":"…","name":"Dona Rosa","email":"dona.rosa@mercado.co"}, …}}

Cabeceras de un login exitoso:

    Set-Cookie: accessToken=<jwt>; Max-Age=900; Path=/; HttpOnly; Secure; SameSite=Strict
    Set-Cookie: refreshToken=<jwt>; Max-Age=604800; Path=/api/v1/auth; HttpOnly; Secure; SameSite=Strict

## Cómo ejecutar

    docker compose up -d
    pnpm install
    copy .env.example .env
    pnpm dev

En `.env`, genera dos secretos **distintos** (por ejemplo, con `openssl rand -base64 64`) para `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`. Si los secretos son iguales o muy cortos, el servidor no arranca.

`pnpm-workspace.yaml` autoriza el script de instalación de `bcrypt` (`onlyBuiltDependencies`), que pnpm 10 bloquea por defecto. Sin él, `bcrypt` se instala sin su binario nativo.

## Flujo de prueba (Thunder Client / Postman / curl)

1. `POST /auth/register` → 201
2. `POST /auth/login` → 200 con las dos cookies
3. `GET /products` sin cookie → 401
4. `POST /products` → 201, `GET /products`, `GET /products/:id`, `PATCH /products/:id`, `DELETE /products/:id` → 204
5. `POST /auth/refresh` → 200 con cookies nuevas; reutilizar el refresh anterior → 401
6. `POST /auth/logout` → 200; `POST /auth/refresh` después del logout → 401

`localhost` cuenta como origen seguro, así que las cookies `Secure` funcionan en `http://localhost` tanto en navegadores como en curl. Solo si pruebas desde otro host por http, pon `COOKIE_SECURE=false`.
