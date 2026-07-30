# Semana 01 — Procesador de Datos: Mercado Campesino

## Dominio

Este proyecto aplica el dominio propio **"Mercado Campesino"**, adaptando el procesador de datos genérico a un catálogo de productos agrícolas.

## Recurso principal: Product

| Campo    | Tipo    | Descripción                              |
|----------|---------|-------------------------------------------|
| id       | string  | Identificador único del producto          |
| name     | string  | Nombre del producto (ej. "Papa criolla")  |
| category | string  | Categoría: verduras, frutas, lacteos, granos |
| price    | number  | Precio en pesos colombianos               |
| stock    | number  | Unidades disponibles                      |
| active   | boolean | Si el producto está activo en el catálogo |

## Funcionalidad implementada

- Lectura de `data/products.json` con `fs/promises`
- Cálculo de resumen: total, activos/inactivos, precio promedio, más caro/más barato, categorías
- Filtro por categoría vía `--category` (case-insensitive)
- Generación de reporte en `output/report.json`
- Manejo de errores: archivo no encontrado y categoría inexistente

## Cómo correr el proyecto

```bash
pnpm install
pnpm dev                         # sin filtro
pnpm dev -- --category frutas    # con filtro
pnpm build                       # verificación de tipos
```