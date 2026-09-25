/**
 * Mock local de la API REST.
 * Reproduce exactamente el contrato del backend:
 *   GET/POST/PUT/DELETE /api/...
 * Al conectar un backend real solo hay que cambiar `VITE_API_URL`
 * (ver `src/services/client.ts`); ningún componente se modifica.
 */

import type {
  Brand,
  Category,
  Generation,
  Paginated,
  Product,
  ProductWithCategory,
  QueryParams,
  SortDirection,
  Vehicle,
  VehicleModel,
  VehicleWithRefs,
} from '@/types';
import type {
  BrandDetail,
  CompatibilityEntry,
  DashboardStats,
  GenerationDetail,
  ModelDetail,
  ProductDetail,
  SearchResult,
  VehicleDetail,
} from '@/types/dto';
import { ApiError } from '@/utils/errors';
import { normalizeText } from '@/utils/format';
import { mutate, getDatabase, type Database } from '@/services/database';
import { uid } from '@/utils/array';

const LATENCY_MIN = 90;
const LATENCY_MAX = 260;

function delay(): Promise<void> {
  const ms = LATENCY_MIN + Math.random() * (LATENCY_MAX - LATENCY_MIN);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type Row = Record<string, unknown>;

function toRow(item: unknown): Row {
  return item as Row;
}

function compare(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return String(a).localeCompare(String(b), 'es');
}

function applySort<T>(items: T[], field?: string, direction?: SortDirection): T[] {
  if (!field) return items;
  const dir = direction === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => dir * compare(toRow(a)[field], toRow(b)[field]));
}

function paginate<T>(
  items: T[],
  page: string | number | boolean | null | undefined,
  pageSize: string | number | boolean | null | undefined,
): Paginated<T> {
  const total = items.length;
  const requestedPage = Math.max(1, Number(page ?? 1) || 1);
  const requestedSize = pageSize === undefined ? 10 : Number(pageSize);
  // pageSize = 0 => listado completo (selectores, filtros)
  const size = requestedSize === 0 ? Math.max(total, 1) : Math.max(1, requestedSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(requestedPage, totalPages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    total,
    page: current,
    pageSize: size,
    totalPages,
  };
}

function includesTerm(text: string, term: string): boolean {
  return normalizeText(text).includes(normalizeText(term));
}

function notFound(entity: string): never {
  throw new ApiError(`${entity} no encontrado`, 404);
}

function badRequest(message: string): never {
  throw new ApiError(message, 400);
}

/* ------------------------------------------------------------------ */
/* Enriquecimiento (joins)                                             */
/* ------------------------------------------------------------------ */

function refs(db: Database, vehicle: Vehicle): VehicleWithRefs {
  const generation = db.generations.find((g) => g.id === vehicle.generationId);
  if (!generation) return { ...vehicle, generation: {} as never, model: {} as never, brand: {} as never };
  const model = db.models.find((m) => m.id === generation.modelId);
  const brand = model ? db.brands.find((b) => b.id === model.brandId) : undefined;
  return {
    ...vehicle,
    generation,
    model: model ?? ({} as VehicleModel),
    brand: brand ?? ({} as Brand),
  };
}

function withCategory(db: Database, product: Product): ProductWithCategory {
  const category = db.categories.find((c) => c.id === product.categoryId);
  return {
    ...product,
    category: category ?? { id: '', name: 'Sin categoría', description: '', active: true, createdAt: '' },
    compatibilityCount: db.compatibility.filter((c) => c.productId === product.id).length,
  };
}

function searchVehicles(db: Database, term: string): VehicleWithRefs[] {
  if (!term.trim()) return [];
  const needle = normalizeText(term);
  return db.vehicles
    .filter((vehicle) => {
      const view = refs(db, vehicle);
      const haystack = [
        view.brand.name,
        view.model.name,
        view.generation.name,
        String(view.year),
        view.version,
        view.engine,
        view.bodyType,
        view.fuel,
      ].join(' ');
      return includesTerm(haystack, needle);
    })
    .map((vehicle) => refs(db, vehicle));
}

function searchProducts(db: Database, term: string): ProductWithCategory[] {
  if (!term.trim()) return [];
  const needle = normalizeText(term);
  return db.products
    .filter((product) => {
      const view = withCategory(db, product);
      const haystack = [
        view.name,
        view.sku,
        view.brand,
        view.category.name,
        view.description,
        view.tags.join(' '),
      ].join(' ');
      return includesTerm(haystack, needle);
    })
    .map((product) => withCategory(db, product));
}

/* ------------------------------------------------------------------ */
/* Estadísticas del dashboard                                          */
/* ------------------------------------------------------------------ */

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function buildStats(db: Database): DashboardStats {
  const monthly: DashboardStats['monthly'] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const vehicles = db.vehicles.filter((v) => {
      const d = new Date(v.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}` === key;
    }).length;
    const products = db.products.filter((p) => {
      const d = new Date(p.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}` === key;
    }).length;
    monthly.push({ month: MONTH_LABELS[date.getMonth()], vehicles, products });
  }

  const categoryCounts = new Map<string, number>();
  db.products.forEach((product) => {
    const category = db.categories.find((c) => c.id === product.categoryId);
    const name = category?.name ?? 'Otros';
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  });

  const brandCounts = new Map<string, number>();
  db.vehicles.forEach((vehicle) => {
    const generation = db.generations.find((g) => g.id === vehicle.generationId);
    const model = generation ? db.models.find((m) => m.id === generation.modelId) : undefined;
    const brand = model ? db.brands.find((b) => b.id === model.brandId) : undefined;
    if (brand) brandCounts.set(brand.name, (brandCounts.get(brand.name) ?? 0) + 1);
  });

  const fuelCounts = new Map<string, number>();
  db.vehicles.forEach((vehicle) => {
    fuelCounts.set(vehicle.fuel, (fuelCounts.get(vehicle.fuel) ?? 0) + 1);
  });

  const low = db.settings.lowStockThreshold;
  const outOfStock = db.products.filter((p) => p.stock === 0).length;
  const lowStock = db.products.filter((p) => p.stock > 0 && p.stock <= low).length;

  const ranges: Array<{ range: string; min: number; max: number }> = [
    { range: '< $50', min: 0, max: 50 },
    { range: '$50 - $150', min: 50, max: 150 },
    { range: '$150 - $300', min: 150, max: 300 },
    { range: '$300 - $500', min: 300, max: 500 },
    { range: '> $500', min: 500, max: Number.MAX_SAFE_INTEGER },
  ];

  const recentProducts = [...db.products]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map((p) => withCategory(db, p));

  const recentVehicles = [...db.vehicles]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map((v) => refs(db, v));

  return {
    totals: {
      vehicles: db.vehicles.length,
      brands: db.brands.length,
      models: db.models.length,
      generations: db.generations.length,
      products: db.products.length,
      activeProducts: db.products.filter((p) => p.active).length,
      outOfStock,
      lowStock,
      categories: db.categories.length,
      compatibility: db.compatibility.length,
      users: db.users.length,
    },
    monthly,
    categoryDistribution: [...categoryCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    brandDistribution: [...brandCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    fuelDistribution: [...fuelCounts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value),
    stockStatus: [
      { name: 'Disponible', value: db.products.filter((p) => p.stock > low).length },
      { name: 'Stock bajo', value: lowStock },
      { name: 'Agotado', value: outOfStock },
    ],
    priceRange: ranges.map((r) => ({
      range: r.range,
      value: db.products.filter((p) => p.price >= r.min && p.price < r.max).length,
    })),
    recentProducts,
    recentVehicles,
  };
}

/* ------------------------------------------------------------------ */
/* Router                                                              */
/* ------------------------------------------------------------------ */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

function splitPath(path: string): { base: string; segments: string[]; query: URLSearchParams } {
  const [rawPath, rawQuery = ''] = path.split('?');
  const clean = rawPath.replace(/^\/api/, '');
  const parts = clean.split('/').filter(Boolean);
  // `segments` contiene solo los tramos posteriores al recurso base
  // ('/api/vehicles/v1' → base 'vehicles', segments ['v1']).
  return { base: parts[0] ?? '', segments: parts.slice(1), query: new URLSearchParams(rawQuery) };
}

function queryToParams(query: URLSearchParams): QueryParams {
  const params: QueryParams = {};
  query.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

export async function mockRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  await delay();
  const { base, segments, query } = splitPath(path);
  const db = getDatabase();

  switch (base) {
    case 'dashboard':
      return buildStats(db) as unknown as T;

    case 'search': {
      const term = query.get('q') ?? '';
      const brandId = query.get('brandId') ?? '';
      const modelId = query.get('modelId') ?? '';
      const year = query.get('year') ?? '';
      const categoryId = query.get('categoryId') ?? '';
      const availability = query.get('availability') ?? '';
      const minPrice = query.get('minPrice') ?? '';
      const maxPrice = query.get('maxPrice') ?? '';

      const tokens = normalizeText(term).split(/\s+/).filter(Boolean);
      const yearToken = tokens.find((t) => /^\d{4}$/.test(t));
      const textTokens = tokens.filter((t) => !/^\d{4}$/.test(t));

      let vehicles = term.trim() ? searchVehicles(db, term) : db.vehicles.map((v) => refs(db, v));
      if (brandId) vehicles = vehicles.filter((v) => v.brand.id === brandId);
      if (modelId) vehicles = vehicles.filter((v) => v.model.id === modelId);
      if (year) vehicles = vehicles.filter((v) => String(v.year) === year);

      const productTerm = textTokens.join(' ');
      let products =
        productTerm.length > 0
          ? searchProducts(db, productTerm)
          : yearToken
            ? productsForYear(db, Number(yearToken))
            : db.products.map((p) => withCategory(db, p));

      if (brandId || modelId || year) {
        const vehicleIds = new Set(db.vehicles.filter((v) => {
          const view = refs(db, v);
          if (brandId && view.brand.id !== brandId) return false;
          if (modelId && view.model.id !== modelId) return false;
          if (year && String(v.year) !== year) return false;
          return true;
        }).map((v) => v.id));

        products = products.filter((product) =>
          db.compatibility.some((c) => c.productId === product.id && vehicleIds.has(c.vehicleId)),
        );
      }

      if (categoryId) products = products.filter((p) => p.categoryId === categoryId);
      if (availability === 'in')
        products = products.filter((p) => p.stock > 0 && p.active);
      if (availability === 'out') products = products.filter((p) => p.stock === 0);
      if (availability === 'promo') products = products.filter((p) => p.promotionalPrice !== null);
      if (minPrice) products = products.filter((p) => p.price >= Number(minPrice));
      if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));

      const result: SearchResult = {
        vehicles: vehicles.slice(0, 40),
        products: products.slice(0, 60),
        total: vehicles.length + products.length,
        query: term,
      };
      return result as unknown as T;
    }

    case 'brands': {
      if (segments.length === 0) {
        if (method === 'POST') return createBrand(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.brands];
        const term = String(params.search ?? '');
        if (term) items = items.filter((b) => includesTerm(`${b.name} ${b.country}`, term));
        if (params.active !== undefined && params.active !== '')
          items = items.filter((b) => String(b.active) === String(params.active));
        items = applySort(items, String(params.sortField ?? 'name'), params.sortDirection as SortDirection);
        const result = paginate(items, params.page, params.pageSize);
        if (!params.detail) {
          return result as unknown as T;
        }
        return {
          ...result,
          items: result.items.map((brand) => brandDetail(db, brand)),
        } as unknown as T;
      }

      const brand = db.brands.find((b) => b.id === segments[0]);
      if (!brand) notFound('Marca');

      if (segments[1] === 'models') {
        const models = db.models.filter((m) => m.brandId === brand.id);
        return paginate(models, query.get('page'), query.get('pageSize')) as unknown as T;
      }

      if (segments.length === 1) {
        if (method === 'GET') return brandDetail(db, brand) as unknown as T;
        if (method === 'PUT' || method === 'PATCH') return updateBrand(db, brand.id, body) as unknown as T;
        if (method === 'DELETE') {
          if (db.models.some((m) => m.brandId === brand.id))
            badRequest('No se puede eliminar: la marca tiene modelos asociados.');
          mutate((d) => {
            d.brands = d.brands.filter((b) => b.id !== brand.id);
          });
          return { ok: true } as unknown as T;
        }
      }
      break;
    }

    case 'models': {
      if (segments.length === 0) {
        if (method === 'POST') return createModel(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.models];
        const term = String(params.search ?? '');
        if (term) {
          items = items.filter((m) => {
            const brand = db.brands.find((b) => b.id === m.brandId);
            return includesTerm(`${m.name} ${brand?.name ?? ''}`, term);
          });
        }
        if (params.brandId) items = items.filter((m) => m.brandId === params.brandId);
        if (params.active !== undefined && params.active !== '')
          items = items.filter((m) => String(m.active) === String(params.active));
        items = applySort(items, String(params.sortField ?? 'name'), params.sortDirection as SortDirection);
        const result = paginate(items, params.page, params.pageSize);
        const mapped = result.items.map((model) => modelDetail(db, model));
        return { ...result, items: mapped } as unknown as T;
      }

      const model = db.models.find((m) => m.id === segments[0]);
      if (!model) notFound('Modelo');
      if (method === 'GET') return modelDetail(db, model) as unknown as T;
      if (method === 'PUT' || method === 'PATCH') return updateModel(db, model.id, body) as unknown as T;
      if (method === 'DELETE') {
        if (db.generations.some((g) => g.modelId === model.id))
          badRequest('No se puede eliminar: el modelo tiene generaciones asociadas.');
        mutate((d) => {
          d.models = d.models.filter((m) => m.id !== model.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'generations': {
      if (segments.length === 0) {
        if (method === 'POST') return createGeneration(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.generations];
        if (params.modelId) items = items.filter((g) => g.modelId === params.modelId);
        if (params.search) items = items.filter((g) => includesTerm(g.name, String(params.search)));
        items = applySort(items, String(params.sortField ?? 'startYear'), params.sortDirection as SortDirection);
        const result = paginate(items, params.page, params.pageSize);
        return { ...result, items: result.items.map((g) => generationDetail(db, g)) } as unknown as T;
      }
      const generation = db.generations.find((g) => g.id === segments[0]);
      if (!generation) notFound('Generación');
      if (method === 'GET') return generationDetail(db, generation) as unknown as T;
      if (method === 'PUT' || method === 'PATCH') return updateGeneration(db, generation.id, body) as unknown as T;
      if (method === 'DELETE') {
        if (db.vehicles.some((v) => v.generationId === generation.id))
          badRequest('No se puede eliminar: la generación tiene vehículos asociados.');
        mutate((d) => {
          d.generations = d.generations.filter((g) => g.id !== generation.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'vehicles': {
      if (segments.length === 0) {
        if (method === 'POST') return createVehicle(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.vehicles];
        const term = String(params.search ?? '');
        if (term) {
          const matched = new Set(searchVehicles(db, term).map((v) => v.id));
          items = items.filter((v) => matched.has(v.id));
        }
        if (params.brandId) {
          const brand = db.brands.find((b) => b.id === params.brandId);
          const modelIds = new Set(db.models.filter((m) => m.brandId === brand?.id).map((m) => m.id));
          const genIds = new Set(db.generations.filter((g) => modelIds.has(g.modelId)).map((g) => g.id));
          items = items.filter((v) => genIds.has(v.generationId));
        }
        if (params.modelId) {
          const genIds = new Set(db.generations.filter((g) => g.modelId === params.modelId).map((g) => g.id));
          items = items.filter((v) => genIds.has(v.generationId));
        }
        if (params.generationId) items = items.filter((v) => v.generationId === params.generationId);
        if (params.year) items = items.filter((v) => String(v.year) === String(params.year));
        if (params.bodyType) items = items.filter((v) => v.bodyType === params.bodyType);
        if (params.fuel) items = items.filter((v) => v.fuel === params.fuel);
        if (params.transmission) items = items.filter((v) => v.transmission === params.transmission);
        if (params.drivetrain) items = items.filter((v) => v.drivetrain === params.drivetrain);
        if (params.active !== undefined && params.active !== '')
          items = items.filter((v) => String(v.active) === String(params.active));

        const sortField = String(params.sortField ?? 'year');
        items = applySort(items, sortField, params.sortDirection as SortDirection);
        if (!params.sortField) items = items.sort((a, b) => b.year - a.year);
        const result = paginate(items, params.page, params.pageSize);
        return { ...result, items: result.items.map((v) => refs(db, v)) } as unknown as T;
      }

      if (segments[1] === 'products') {
        const vehicle = db.vehicles.find((v) => v.id === segments[0]);
        if (!vehicle) notFound('Vehículo');
        const productIds = new Set(
          db.compatibility.filter((c) => c.vehicleId === vehicle.id).map((c) => c.productId),
        );
        let items = db.products.filter((p) => productIds.has(p.id)).map((p) => withCategory(db, p));
        const categoryId = query.get('categoryId');
        if (categoryId) items = items.filter((p) => p.categoryId === categoryId);
        const term = query.get('search');
        if (term) items = items.filter((p) => includesTerm(`${p.name} ${p.sku}`, term));
        items = applySort(items, query.get('sortField') ?? 'name', query.get('sortDirection') as SortDirection);
        return paginate(items, query.get('page'), query.get('pageSize')) as unknown as T;
      }

      const vehicle = db.vehicles.find((v) => v.id === segments[0]);
      if (!vehicle) notFound('Vehículo');
      if (method === 'GET') return vehicleDetail(db, vehicle) as unknown as T;
      if (method === 'PUT' || method === 'PATCH') return updateVehicle(db, vehicle.id, body) as unknown as T;
      if (method === 'DELETE') {
        if (db.compatibility.some((c) => c.vehicleId === vehicle.id))
          badRequest('No se puede eliminar: el vehículo tiene compatibilidades asociadas.');
        mutate((d) => {
          d.vehicles = d.vehicles.filter((v) => v.id !== vehicle.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'categories': {
      if (segments.length === 0) {
        if (method === 'POST') return createCategory(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.categories];
        if (params.search) items = items.filter((c) => includesTerm(c.name, String(params.search)));
        if (params.active !== undefined && params.active !== '')
          items = items.filter((c) => String(c.active) === String(params.active));
        items = applySort(items, String(params.sortField ?? 'name'), params.sortDirection as SortDirection);
        return paginate(items, params.page, params.pageSize) as unknown as T;
      }
      const category = db.categories.find((c) => c.id === segments[0]);
      if (!category) notFound('Categoría');
      if (method === 'PUT' || method === 'PATCH') return updateCategory(db, category.id, body) as unknown as T;
      if (method === 'DELETE') {
        if (db.products.some((p) => p.categoryId === category.id))
          badRequest('No se puede eliminar: la categoría tiene productos asociados.');
        mutate((d) => {
          d.categories = d.categories.filter((c) => c.id !== category.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'products': {
      if (segments.length === 0) {
        if (method === 'POST') return createProduct(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.products].map((p) => withCategory(db, p));
        const term = String(params.search ?? '');
        if (term)
          items = items.filter((p) =>
            includesTerm(`${p.name} ${p.sku} ${p.brand} ${p.category.name}`, term),
          );
        if (params.categoryId) items = items.filter((p) => p.categoryId === params.categoryId);
        if (params.active !== undefined && params.active !== '')
          items = items.filter((p) => String(p.active) === String(params.active));
        if (params.availability === 'in') items = items.filter((p) => p.stock > 0);
        if (params.availability === 'out') items = items.filter((p) => p.stock === 0);
        if (params.minPrice) items = items.filter((p) => p.price >= Number(params.minPrice));
        if (params.maxPrice) items = items.filter((p) => p.price <= Number(params.maxPrice));
        if (params.vehicleId) {
          const ids = new Set(
            db.compatibility.filter((c) => c.vehicleId === params.vehicleId).map((c) => c.productId),
          );
          items = items.filter((p) => ids.has(p.id));
        }
        items = applySort(
          items,
          String(params.sortField ?? 'name'),
          params.sortDirection as SortDirection,
        );
        return paginate(items, params.page, params.pageSize) as unknown as T;
      }

      if (segments[1] === 'duplicate' && method === 'POST') {
        const source = db.products.find((p) => p.id === segments[0]);
        if (!source) notFound('Producto');
        const copy = mutate((d) => {
          const newProduct: Product = {
            ...source,
            id: uid('pr'),
            sku: `${source.sku}-C`,
            name: `${source.name} (copia)`,
            active: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          d.products.unshift(newProduct);
          return newProduct;
        });
        return withCategory(getDatabase(), copy) as unknown as T;
      }

      const product = db.products.find((p) => p.id === segments[0]);
      if (!product) notFound('Producto');
      if (method === 'GET') return productDetail(db, product) as unknown as T;
      if (method === 'PUT' || method === 'PATCH') return updateProduct(db, product.id, body) as unknown as T;
      if (method === 'DELETE') {
        mutate((d) => {
          d.products = d.products.filter((p) => p.id !== product.id);
          d.compatibility = d.compatibility.filter((c) => c.productId !== product.id);
          d.productImages = d.productImages.filter((i) => i.productId !== product.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'compatibility': {
      if (segments.length === 0) {
        if (method === 'POST') return addCompatibility(db, body) as unknown as T;
        const params = queryToParams(query);
        let items = [...db.compatibility];
        if (params.productId) items = items.filter((c) => c.productId === params.productId);
        if (params.vehicleId) items = items.filter((c) => c.vehicleId === params.vehicleId);
        if (params.search) {
          const term = String(params.search);
          items = items.filter((c) => {
            const vehicle = db.vehicles.find((v) => v.id === c.vehicleId);
            const product = db.products.find((p) => p.id === c.productId);
            if (!vehicle || !product) return false;
            const view = refs(db, vehicle);
            return includesTerm(
              `${view.brand.name} ${view.model.name} ${view.year} ${view.version} ${product.name}`,
              term,
            );
          });
        }
        items = applySort(items, String(params.sortField ?? 'createdAt'), params.sortDirection as SortDirection);
        const result = paginate(items, params.page, params.pageSize);
        const mapped: CompatibilityEntry[] = result.items.map((c) => {
          const vehicle = db.vehicles.find((v) => v.id === c.vehicleId);
          const product = db.products.find((p) => p.id === c.productId);
          return {
            ...c,
            vehicle: vehicle ? refs(db, vehicle) : ({} as VehicleWithRefs),
            product: product ? withCategory(db, product) : ({} as ProductWithCategory),
          };
        });
        return { ...result, items: mapped } as unknown as T;
      }

      if (method === 'DELETE') {
        const id = segments[0];
        mutate((d) => {
          d.compatibility = d.compatibility.filter((c) => c.id !== id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'users': {
      if (segments.length === 0) {
        if (method === 'POST') {
          const input = body as { name: string; email: string; role: string };
          const created = mutate((d) => {
            const user = {
              id: uid('us'),
              name: input.name,
              email: input.email,
              role: input.role as 'Administrador' | 'Editor' | 'Visualizador',
              active: true,
              createdAt: new Date().toISOString(),
            };
            d.users.unshift(user);
            return user;
          });
          return created as unknown as T;
        }
        const params = queryToParams(query);
        let items = [...db.users];
        if (params.search)
          items = items.filter((u) => includesTerm(`${u.name} ${u.email}`, String(params.search)));
        items = applySort(items, String(params.sortField ?? 'name'), params.sortDirection as SortDirection);
        return paginate(items, params.page, params.pageSize) as unknown as T;
      }
      const user = db.users.find((u) => u.id === segments[0]);
      if (!user) notFound('Usuario');
      if (method === 'PUT' || method === 'PATCH') {
        const input = body as Partial<typeof user>;
        const updated = mutate((d) => {
          const target = d.users.find((u) => u.id === user.id);
          if (target) Object.assign(target, input, { id: target.id });
          return target ?? user;
        });
        return updated as unknown as T;
      }
      if (method === 'DELETE') {
        mutate((d) => {
          d.users = d.users.filter((u) => u.id !== user.id);
        });
        return { ok: true } as unknown as T;
      }
      break;
    }

    case 'settings': {
      if (method === 'PUT' || method === 'PATCH') {
        const input = body as Partial<Database['settings']>;
        const updated = mutate((d) => {
          d.settings = { ...d.settings, ...input };
          return d.settings;
        });
        return updated as unknown as T;
      }
      return db.settings as unknown as T;
    }

    case 'stats': {
      return buildStats(db) as unknown as T;
    }

    default:
      badRequest(`Ruta no soportada: ${path}`);
  }

  badRequest(`Ruta no soportada: ${method} ${path}`);
}

/* ------------------------------------------------------------------ */
/* Operaciones CRUD                                                    */
/* ------------------------------------------------------------------ */

function brandDetail(db: Database, brand: Brand): BrandDetail {
  const models = db.models.filter((m) => m.brandId === brand.id);
  const modelIds = new Set(models.map((m) => m.id));
  const generationIds = new Set(db.generations.filter((g) => modelIds.has(g.modelId)).map((g) => g.id));
  return {
    ...brand,
    modelCount: models.length,
    vehicleCount: db.vehicles.filter((v) => generationIds.has(v.generationId)).length,
    models,
  };
}

function modelDetail(db: Database, model: VehicleModel): ModelDetail {
  const brand = db.brands.find((b) => b.id === model.brandId);
  const generations = db.generations.filter((g) => g.modelId === model.id);
  const generationIds = new Set(generations.map((g) => g.id));
  return {
    ...model,
    brand: brand ?? ({} as Brand),
    generations,
    vehicleCount: db.vehicles.filter((v) => generationIds.has(v.generationId)).length,
  };
}

function generationDetail(db: Database, generation: Generation): GenerationDetail {
  const model = db.models.find((m) => m.id === generation.modelId);
  const brand = model ? db.brands.find((b) => b.id === model.brandId) : undefined;
  return {
    ...generation,
    model: model ?? ({} as VehicleModel),
    brand: brand ?? ({} as Brand),
    vehicleCount: db.vehicles.filter((v) => v.generationId === generation.id).length,
  };
}

function productDetail(db: Database, product: Product): ProductDetail {
  const vehicleIds = new Set(
    db.compatibility.filter((c) => c.productId === product.id).map((c) => c.vehicleId),
  );
  const vehicles = db.vehicles.filter((v) => vehicleIds.has(v.id)).map((v) => refs(db, v));
  const related = db.products
    .filter((p) => p.id !== product.id && (p.categoryId === product.categoryId || p.brand === product.brand))
    .slice(0, 6)
    .map((p) => withCategory(db, p));
  const images = db.productImages
    .filter((i) => i.productId === product.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  return { ...withCategory(db, product), images, vehicles, related };
}

function vehicleDetail(db: Database, vehicle: Vehicle): VehicleDetail {
  const base = refs(db, vehicle);
  const compatibility: CompatibilityEntry[] = db.compatibility
    .filter((c) => c.vehicleId === vehicle.id)
    .map((c) => {
      const product = db.products.find((p) => p.id === c.productId);
      return {
        ...c,
        vehicle: base,
        product: product ? withCategory(db, product) : ({} as ProductWithCategory),
      };
    });

  const siblingVersions = db.vehicles
    .filter((v) => v.generationId === vehicle.generationId && v.id !== vehicle.id && v.year === vehicle.year)
    .map((v) => refs(db, v));

  const recommended = db.products
    .filter((p) => !compatibility.some((c) => c.product.id === p.id) && p.stock > 0)
    .slice(0, 6)
    .map((p) => withCategory(db, p));

  return { ...base, compatibility, siblingVersions, recommended };
}

function productsForYear(db: Database, year: number): ProductWithCategory[] {
  const vehicleIds = new Set(db.vehicles.filter((v) => v.year === year).map((v) => v.id));
  const ids = new Set(
    db.compatibility.filter((c) => vehicleIds.has(c.vehicleId)).map((c) => c.productId),
  );
  return db.products.filter((p) => ids.has(p.id)).map((p) => withCategory(db, p));
}

function createBrand(db: Database, body: unknown): Brand {
  const input = body as Partial<Brand>;
  if (!input?.name) badRequest('El nombre es obligatorio');
  if (db.brands.some((b) => normalizeText(b.name) === normalizeText(input.name ?? '')))
    badRequest('Ya existe una marca con ese nombre');
  const brand = mutate((d) => {
    const created: Brand = {
      id: uid('br'),
      name: input.name ?? '',
      logo: input.logo ?? '',
      country: input.country ?? '',
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    d.brands.unshift(created);
    return created;
  });
  return brand;
}

function updateBrand(_db: Database, id: string, body: unknown): Brand {
  const input = body as Partial<Brand>;
  const updated = mutate((d) => {
    const target = d.brands.find((b) => b.id === id);
    if (!target) notFound('Marca');
    Object.assign(target, input, { id: target.id });
    return target;
  });
  return updated;
}

function createModel(_db: Database, body: unknown): VehicleModel {
  const input = body as Partial<VehicleModel>;
  if (!input?.name || !input.brandId) badRequest('Marca y modelo son obligatorios');
  const model = mutate((d) => {
    const created: VehicleModel = {
      id: uid('md'),
      brandId: input.brandId ?? '',
      name: input.name ?? '',
      bodyType: input.bodyType ?? 'Sedán',
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    d.models.unshift(created);
    return created;
  });
  return model;
}

function updateModel(_db: Database, id: string, body: unknown): VehicleModel {
  const input = body as Partial<VehicleModel>;
  return mutate((d) => {
    const target = d.models.find((m) => m.id === id);
    if (!target) notFound('Modelo');
    Object.assign(target, input, { id: target.id });
    return target;
  });
}

function createGeneration(_db: Database, body: unknown): Generation {
  const input = body as Partial<Generation>;
  if (!input?.modelId || !input.name) badRequest('Modelo y generación son obligatorios');
  const generation = mutate((d) => {
    const created: Generation = {
      id: uid('gn'),
      modelId: input.modelId ?? '',
      name: input.name ?? '',
      startYear: Number(input.startYear ?? new Date().getFullYear()),
      endYear: input.endYear ? Number(input.endYear) : null,
    };
    d.generations.unshift(created);
    return created;
  });
  return generation;
}

function updateGeneration(_db: Database, id: string, body: unknown): Generation {
  const input = body as Partial<Generation>;
  return mutate((d) => {
    const target = d.generations.find((g) => g.id === id);
    if (!target) notFound('Generación');
    Object.assign(target, input, { id: target.id, endYear: input.endYear ?? null });
    return target;
  });
}

function createVehicle(_db: Database, body: unknown): Vehicle {
  const input = body as Partial<Vehicle>;
  if (!input?.generationId) badRequest('La generación es obligatoria');
  const vehicle = mutate((d) => {
    const created: Vehicle = {
      id: uid('vh'),
      generationId: input.generationId ?? '',
      year: Number(input.year ?? new Date().getFullYear()),
      version: input.version ?? '',
      engine: input.engine ?? '',
      fuel: input.fuel ?? 'Gasolina',
      transmission: input.transmission ?? 'Manual',
      drivetrain: input.drivetrain ?? 'FWD',
      bodyType: input.bodyType ?? 'Sedán',
      power: Number(input.power ?? 0),
      displacement: Number(input.displacement ?? 0),
      image: input.image ?? '',
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    d.vehicles.unshift(created);
    return created;
  });
  return vehicle;
}

function updateVehicle(_db: Database, id: string, body: unknown): Vehicle {
  const input = body as Partial<Vehicle>;
  return mutate((d) => {
    const target = d.vehicles.find((v) => v.id === id);
    if (!target) notFound('Vehículo');
    Object.assign(target, input, { id: target.id });
    return target;
  });
}

function createCategory(_db: Database, body: unknown): Category {
  const input = body as Partial<Category>;
  if (!input?.name) badRequest('El nombre es obligatorio');
  const category = mutate((d) => {
    const created: Category = {
      id: uid('ct'),
      name: input.name ?? '',
      description: input.description ?? '',
      active: input.active ?? true,
      createdAt: new Date().toISOString(),
    };
    d.categories.unshift(created);
    return created;
  });
  return category;
}

function updateCategory(_db: Database, id: string, body: unknown): Category {
  const input = body as Partial<Category>;
  return mutate((d) => {
    const target = d.categories.find((c) => c.id === id);
    if (!target) notFound('Categoría');
    Object.assign(target, input, { id: target.id });
    return target;
  });
}

function createProduct(db: Database, body: unknown): Product {
  const input = body as Partial<Product>;
  if (!input?.name || !input.sku) badRequest('Nombre y SKU son obligatorios');
  if (db.products.some((p) => normalizeText(p.sku) === normalizeText(input.sku ?? '')))
    badRequest('Ya existe un producto con ese SKU');
  const product = mutate((d) => {
    const now = new Date().toISOString();
    const created: Product = {
      id: uid('pr'),
      sku: input.sku ?? '',
      name: input.name ?? '',
      description: input.description ?? '',
      categoryId: input.categoryId ?? '',
      brand: input.brand ?? '',
      price: Number(input.price ?? 0),
      promotionalPrice: input.promotionalPrice ?? null,
      stock: Number(input.stock ?? 0),
      image: input.image ?? '',
      gallery: input.gallery ?? [],
      specs: input.specs ?? [],
      installation: input.installation ?? '',
      tags: input.tags ?? [],
      active: input.active ?? true,
      createdAt: now,
      updatedAt: now,
    };
    d.products.unshift(created);
    return created;
  });
  return product;
}

function updateProduct(_db: Database, id: string, body: unknown): Product {
  const input = body as Partial<Product>;
  return mutate((d) => {
    const target = d.products.find((p) => p.id === id);
    if (!target) notFound('Producto');
    Object.assign(target, input, { id: target.id, updatedAt: new Date().toISOString() });
    return target;
  });
}

interface CompatibilityInput {
  productId?: string;
  vehicleIds?: string[];
  vehicleId?: string;
  notes?: string;
}

function addCompatibility(db: Database, body: unknown): { created: number } {
  const input = (body ?? {}) as CompatibilityInput;
  if (!input.productId) badRequest('El producto es obligatorio');
  const vehicleIds = input.vehicleIds ?? (input.vehicleId ? [input.vehicleId] : []);
  if (vehicleIds.length === 0) badRequest('Selecciona al menos un vehículo');

  const invalid = vehicleIds.filter((id) => !db.vehicles.some((v) => v.id === id));
  if (invalid.length > 0) badRequest('Algunos vehículos seleccionados no existen');

  const created = mutate((d) => {
    let count = 0;
    vehicleIds.forEach((vehicleId) => {
      if (d.compatibility.some((c) => c.productId === input.productId && c.vehicleId === vehicleId)) return;
      count += 1;
      d.compatibility.unshift({
        id: uid('cp'),
        productId: input.productId ?? '',
        vehicleId,
        notes: input.notes ?? '',
        createdAt: new Date().toISOString(),
      });
    });
    return count;
  });
  return { created };
}
