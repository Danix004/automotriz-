# AutoEquip Pro

Sistema profesional de gestión de **equipamiento y accesorios automotrices**: catálogo jerárquico
(marcas → modelos → generaciones → vehículos), productos, compatibilidades producto↔vehículo,
usuarios, categorías, configuración y dashboard con métricas.

> React 18 · TypeScript (strict) · Vite 5 · Tailwind CSS (dark mode) · React Router 6 · TanStack Query ·
> Zustand · React Hook Form + Zod · Recharts · Lucide — API serverless (Vercel Functions) + MySQL/TiDB.

---

## 1. Requisitos

- Node.js ≥ 20 (probado con Node 24)
- npm ≥ 10
- Una base **TiDB Cloud** (compatible con MySQL) para el modo remoto
- Cuentas: GitHub y Vercel (solo para publicar)

## 2. Arranque local (modo demo, sin base de datos)

```bash
npm install
npm run dev          # http://localhost:5173
```

Sin `VITE_API_URL` la app usa el **mock local**: genera ~2.000 vehículos y ~5.100 compatibilidades
en `localStorage`, con latencia simulada. Todo el CRUD funciona y no se pierde al recargar.

```bash
npm run typecheck    # tsc --noEmit (strict)
npm run build        # typecheck + vite build → dist/
npm run preview      # sirve dist/
```

## 3. Arquitectura de datos

```
UI (páginas/componentes)
  └─ hooks TanStack Query (src/hooks/queries.ts)
      └─ servicios REST (src/services/*)
          └─ client.ts ──┬─ sin VITE_API_URL  → mockApi.ts + database.ts (localStorage)
                         └─ con VITE_API_URL  → fetch(`${VITE_API_URL}${path}`)
                                                └─ api/[[...slug]].js (Vercel, catch-all)
                                                    └─ server/ (router + db + util) → TiDB
```

El **contrato REST es único**: `mockApi.ts` y `server/router.js` exponen exactamente los mismos
endpoints, por lo que cambiar de backend no toca UI ni hooks.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET/POST | `/api/brands` | Marcas (`?search&active&page&pageSize&sortField&sortDirection&detail=true`) |
| GET/PUT/DELETE | `/api/brands/:id` | Detalle con `models[]`, `modelCount`, `vehicleCount` |
| GET | `/api/brands/:id/models` | Modelos de una marca |
| GET/POST | `/api/models` · `/api/generations` · `/api/vehicles` · `/api/categories` · `/api/products` · `/api/users` | Listados paginados + CRUD |
| GET | `/api/vehicles/:id` | Detalle con `compatibility[]`, `siblingVersions[]`, `recommended[]` |
| GET | `/api/vehicles/:id/products` | Productos compatibles con el vehículo |
| GET | `/api/products/:id` | Detalle con `vehicles[]`, `images[]`, `related[]` |
| GET | `/api/compatibility` | Compatibilidades con joins (`?productId&vehicleId&categoryId&brandId&search…`) |
| POST/DELETE | `/api/compatibility` | Alta/baja de relaciones (bulk en POST) |
| GET | `/api/dashboard/stats` | KPIs, serie de 6 meses y distribución por categoría |
| GET | `/api/search` | Búsqueda global acento/insensible en vehículos y productos |
| GET/PUT | `/api/settings` | Configuración de la aplicación |

Todos los listados devuelven `{ items, total, page, pageSize, totalPages }`.

## 4. Variables de archivo `.env`

Copia `.env.example` a `.env` (**`.env` está en `.gitignore` y nunca se sube a GitHub**):

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | Vacío → mock local. `/api` → API serverless (producción) |
| `DATABASE_URL` | Cadena de conexión de TiDB: `mysql://USUARIO:PASS@host:4000/nombre_db` |
| `DB_CONNECTION_LIMIT` | Tamaño de la pool de conexiones (opcional, `5`) |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` por defecto (TLS con certificado público) |

## 5. Base de datos (TiDB)

```bash
# 1. Crea .env con DATABASE_URL (el script crea la base si no existe)
npm run db:seed          # schema.sql + datos de demostración (borra tablas)
npm run db:seed -- --keep  # inserta sin borrar (respeta lo existente)

# 2. Verifica la API completa contra la base real
npm run test:api         # 22 comprobaciones: listados, joins, detalle, CRUD, search, stats
```

- `database/schema.sql` → `brands, models, generations, vehicles, categories, products,
  product_images, compatibility, users, settings` (claves foráneas, índices y JSON en productos).
- `scripts/seed.mjs` reutiliza el mismo generador que el frontend (`src/data/seed.ts`), así que el
  catálogo local y el remoto coinciden.
- Para desarrollo local con funciones reales: `npm run dev:api` (`vercel dev`, requiere `vercel link`).

## 6. Publicar en GitHub + Vercel

### 6.1 GitHub

```bash
git init
git add .
git commit -m "AutoEquip Pro: React + API serverless + TiDB"
git branch -M main
git remote add origin https://github.com/Danix004/autoequip-pro.git
git push -u origin main
```

**No pegues tokens en el repositorio.** Usa un PAT (scope `repo`) solo para autenticar el push,
o el helper oficial `gh auth login`. Las credenciales se guardan fuera del repo (Keychain /
credential manager), nunca en `.git`.

### 6.2 Vercel (proyecto con API + base de datos)

```bash
vercel link                 # asocia el directorio a un proyecto
vercel env add DATABASE_URL production   # pega la cadena de TiDB
vercel env add VITE_API_URL production   # valor: /api
vercel --prod               # build (npm run build) + despliegue de api/ y dist/
```

`vercel.json` ya define el build de Vite y el rewrite SPA (`/((?!api/.*)` → `index.html`),
dejando `/api/*` intacto para las funciones serverless.

### 6.3 Variables en el panel de Vercel

`Settings → Environment Variables`: `DATABASE_URL`, `VITE_API_URL=/api` (+ `DB_CONNECTION_LIMIT`
si quieres). En **Settings → Domains / Git** puedes conectar el repo para despliegues automáticos.

## 7. Seguridad (importante)

- **Rota la contraseña de TiDB** si alguna vez se compartió o quedó en un historial/chat:
  TiDB Cloud → *Settings → Security → Reset password* y actualiza `DATABASE_URL` (local y Vercel).
- Usa una base de datos propia (`autoequip`), no esquemas del sistema (`sys`).
- Los `.env` nunca se versionan; en Vercel los valores están cifrados y solo visibles para ti.
- No expongas `DATABASE_URL` en variables con prefijo `VITE_` (todo lo `VITE_` se incrusta en el
  bundle del navegador).
- El usuario de TiDB puede acotarse a solo `SELECT/INSERT/UPDATE/DELETE` sobre la base de la app.

## 8. Scripts disponibles

| Script | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (mock local) |
| `npm run build` | Typecheck + build de producción |
| `npm run preview` | Previsualiza `dist/` |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:seed` | Esquema + seed en TiDB |
| `npm run test:api` | Tests de la API serverless contra la base real |
| `npm run dev:api` | `vercel dev` (frontend + funciones en local) |

## 9. Estructura

```
api/[[...slug]].js     Entrada catch-all de Vercel (/api/*)
server/                router.js · db.js (pool mysql2+TLS) · util.js (SQL y mappers)
database/schema.sql    DDL compatible TiDB/MySQL
scripts/               seed.mjs (poblado) · test-api.mjs (tests de API)
src/
  components/          DataTable, SearchInput, FilterPanel, Modal, ConfirmDialog, Pagination…
  features/            selectores y modales (VehicleFilters, CompatibilitySelector…)
  hooks/queries.ts     TanStack Query + estado de filtros en URL
  pages/               16 rutas (Dashboard, Brands, Vehicles, Products, Compatibility…)
  routes/index.tsx     rutas con lazy loading
  services/            client.ts · mockApi.ts · database.ts · recursos REST
  data/                seed.ts · catalog.ts · products.ts (datos de demostración)
  schemas/             validación Zod
  stores/              Zustand (tema, sesión, preferencias)
```

---

Desarrollado con React + TypeScript y pensado para conectar a un backend REST real sin reescrituras.
