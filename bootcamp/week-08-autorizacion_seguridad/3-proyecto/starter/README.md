# Semana 08 — API segura con RBAC (mercado campesino)

## Dominio

**Mercado campesino**. El recurso principal es **Product**: el catálogo del puesto (verduras, frutas, lácteos, granos y tubérculos) con precios en COP. Cualquier comprador puede consultar el catálogo sin cuenta. Los vendedores registran sus productos y solo pueden editar los suyos. El administrador del mercado puede editar y retirar cualquier producto, y gestiona los usuarios.

Stack: Express 5 + TypeScript, MongoDB + Mongoose, JWT en cookies HttpOnly, Helmet, CORS con whitelist, express-rate-limit y express-mongo-sanitize.

## Mi implementación

- **Recurso del dominio:** el `Item` genérico pasó a ser `Product` (modelo `Product`, colección `products`, ruta `/api/v1/products`). Los handlers tienen nombres descriptivos: `getProducts`, `getProductById`, `createProduct`, `updateProduct` y `deleteProduct`. Los archivos conservan el nombre `item.*` del starter para no borrar ni renombrar archivos en este commit.
- **Continuidad con la semana 07:** el producto tiene los mismos campos y validaciones (`sku` único, `price` en COP entre 50 y 5.000.000, `unit` y `category` como enum) y guarda `createdBy`, que ahora se usa para la regla de propiedad. Reemplacé la autenticación del starter por la de la semana 07, que era más segura: tokens solo en cookies `httpOnly` + `secure` + `sameSite: strict`, refresh token guardado como hash (`bcrypt(sha256(token))`) con rotación y detección de reuso, y secretos validados al arrancar. El starter guardaba el refresh token en texto plano y devolvía el access token en el body. Como alternativa para clientes que no son navegador, `authMiddleware` también acepta `Authorization: Bearer`.
- **Roles del mercado:** `user` = vendedor del puesto (rol por defecto al registrarse) y `admin` = administrador del mercado. El registro es `.strict()`, así que nadie puede auto-asignarse `admin`: el administrador inicial sale del seed y solo un admin puede promover a otro usuario (`PATCH /users/:id/role`).
- **Correcciones al starter para Express 5:**
  - `app.options('*', …)` hacía fallar el arranque (`Missing parameter name at index 1: *`). Lo quité porque `cors()` ya responde los preflight (verificado: `OPTIONS` → 204 con `Access-Control-Allow-Methods`).
  - `mongoSanitize()` reasigna `req.query`, que en Express 5 es un getter de solo lectura, y toda request con query terminaba en 500. `src/middlewares/sanitize.ts` usa `sanitize()` de la misma librería y redefine `req.query`.
  - Un origen CORS no permitido generaba un `Error` genérico (500). Ahora es `AppError(403)`.
  - El seed tenía contraseñas escritas en el código. Ahora las lee de `.env` (`SEED_*`).

## Roles y permisos

| Acción | Sin sesión | Vendedor (`user`) | Admin (`admin`) |
|--------|:----------:|:-----------------:|:---------------:|
| Ver catálogo y detalle de productos | ✅ | ✅ | ✅ |
| Registrar un producto | ❌ 401 | ✅ | ✅ |
| Editar un producto propio | ❌ 401 | ✅ | ✅ |
| Editar un producto de otro vendedor | ❌ 401 | ❌ 403 | ✅ |
| Eliminar un producto | ❌ 401 | ❌ 403 | ✅ |
| Ver su panel (`/users/dashboard`) | ❌ 401 | ✅ | ✅ |
| Listar usuarios / cambiar roles | ❌ 401 | ❌ 403 | ✅ |

Los roles se aplican con middleware (`authMiddleware` + `requireRole(...)`) en las rutas, nunca dentro de los controladores. La regla "dueño o admin" para editar vive en el servicio (`canEditProduct`), porque necesita consultar el `createdBy` del producto.

## Endpoints

| Método | Ruta | Acceso | Status |
|--------|------|--------|--------|
| GET | `/api/v1/health` | Público | 200 |
| POST | `/api/v1/auth/register` | Público + rate limit auth | 201 / 400 / 409 / 429 |
| POST | `/api/v1/auth/login` | Público + rate limit auth | 200 / 400 / 401 / 429 |
| POST | `/api/v1/auth/refresh` | Cookie refresh | 200 / 401 |
| POST | `/api/v1/auth/logout` | Autenticado | 200 / 401 |
| GET | `/api/v1/auth/me` | Autenticado | 200 / 401 |
| GET | `/api/v1/users/dashboard` | `user`, `admin` | 200 / 401 |
| GET | `/api/v1/users` | `admin` | 200 / 401 / 403 |
| PATCH | `/api/v1/users/:id/role` | `admin` | 200 / 400 / 401 / 403 / 404 |
| GET | `/api/v1/products?page&limit&search&category&available=true` | Público | 200 |
| GET | `/api/v1/products/:id` | Público | 200 / 400 / 404 |
| POST | `/api/v1/products` | Autenticado | 201 / 400 / 401 / 409 |
| PATCH | `/api/v1/products/:id` | Autenticado + dueño o `admin` | 200 / 400 / 401 / 403 / 404 / 409 |
| DELETE | `/api/v1/products/:id` | `admin` | 204 / 401 / 403 / 404 |

## Capas de seguridad

| Capa | Configuración | Verificación |
|------|---------------|--------------|
| **Helmet** | `helmet()` + `x-powered-by` deshabilitado | `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: no-referrer` en todas las respuestas |
| **CORS** | Whitelist desde `CORS_ORIGINS` (se descarta `*`), `credentials: true` | Origen permitido → `Access-Control-Allow-Origin: http://localhost:5173`; origen desconocido → 403 sin header ACAO |
| **Rate limit global** | 100 req / 15 min por IP | `RateLimit-Limit: 100`, `RateLimit-Remaining: 98` |
| **Rate limit auth** | 5 req / 15 min en `/auth/login` y `/auth/register` | 6.º intento → 429 con `RateLimit-Remaining: 0` |
| **NoSQL injection** | express-mongo-sanitize (compatible con Express 5) + `z.string()` en los campos del body | Login con `{"email":{"$gt":""}}` → 400; el intento queda en el log (`NoSQL injection bloqueada`). Además, el query parser *simple* de Express 5 no crea objetos anidados: `?category[$ne]=frutas` no se convierte en un operador |
| **XSS almacenado** | Los textos libres rechazan `<` y `>`; los bodies de Zod son `.strict()` | `name: "<script>…"` → 400 |
| **Mass assignment** | `.strict()` en register y product | Enviar `role` o `createdBy` → 400 |
| **Errores seguros** | `errorHandler` nunca devuelve el stack; el 500 responde `Error interno del servidor` y el detalle solo va al log | — |
| **Payload** | `express.json({ limit: '10kb' })`; JSON mal formado → 400 | — |
| **Secretos** | Solo en `.env`; al arrancar se exige que existan, que tengan ≥ 32 caracteres y que sean distintos | El servidor no arranca si son iguales |
| **Contraseñas** | bcrypt con 12 salt rounds (`bcrypt.hash`, asíncrono) | — |

## Cómo ejecutar

    docker compose up -d
    pnpm install
    copy .env.example .env      # completa los secretos y las contraseñas SEED_*
    pnpm seed                   # admin + vendedora + 6 productos
    pnpm dev

El `pnpm-workspace.yaml` autoriza el script de instalación de `bcrypt` (`onlyBuiltDependencies`), que pnpm 10 bloquea por defecto.

Salida de `pnpm seed`:

    Iniciando seed...
    Usuarios: admin@mercadocampesino.co (admin) | dona.rosa@mercadocampesino.co (vendedora)
    6 productos creados
    Seed completado
