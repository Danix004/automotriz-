/** Claves de caché de TanStack Query (invalidación centralizada). */

export const queryKeys = {
  brands: (params?: unknown) => ['brands', params] as const,
  brand: (id: string) => ['brand', id] as const,
  models: (params?: unknown) => ['models', params] as const,
  model: (id: string) => ['model', id] as const,
  generations: (params?: unknown) => ['generations', params] as const,
  vehicles: (params?: unknown) => ['vehicles', params] as const,
  vehicle: (id: string) => ['vehicle', id] as const,
  vehicleProducts: (id: string, params?: unknown) => ['vehicle-products', id, params] as const,
  products: (params?: unknown) => ['products', params] as const,
  product: (id: string) => ['product', id] as const,
  categories: (params?: unknown) => ['categories', params] as const,
  compatibility: (params?: unknown) => ['compatibility', params] as const,
  dashboard: ['dashboard', 'stats'] as const,
  search: (params?: unknown) => ['search', params] as const,
  users: (params?: unknown) => ['users', params] as const,
  settings: ['settings'] as const,
  sales: (params?: unknown) => ['sales', params] as const,
  sale: (id: string) => ['sale', id] as const,
  salesReport: (params?: unknown) => ['sales-report', params] as const,

  all: {
    brands: ['brands'] as const,
    models: ['models'] as const,
    generations: ['generations'] as const,
    vehicles: ['vehicles'] as const,
    products: ['products'] as const,
    categories: ['categories'] as const,
    compatibility: ['compatibility'] as const,
    users: ['users'] as const,
    dashboard: ['dashboard'] as const,
    search: ['search'] as const,
    settings: ['settings'] as const,
    sales: ['sales'] as const,
    salesReport: ['sales-report'] as const,
  },
};

/** Invalida todo el catálogo (útil tras CRUDs que afectan a varias vistas). */
export const CATALOG_KEYS = [
  queryKeys.all.brands,
  queryKeys.all.models,
  queryKeys.all.generations,
  queryKeys.all.vehicles,
  queryKeys.all.products,
  queryKeys.all.categories,
  queryKeys.all.compatibility,
  queryKeys.all.dashboard,
  queryKeys.all.search,
];
