/** Constantes de rutas (un solo lugar para enlaces y navegación). */

export const paths = {
  home: '/',
  dashboard: '/dashboard',
  brands: '/brands',
  brand: (id: string) => `/brands/${id}`,
  models: '/models',
  vehicles: '/vehicles',
  vehicleNew: '/vehicles/new',
  vehicle: (id: string) => `/vehicles/${id}`,
  vehicleEdit: (id: string) => `/vehicles/${id}/edit`,
  products: '/products',
  productNew: '/products/new',
  product: (id: string) => `/products/${id}`,
  productEdit: (id: string) => `/products/${id}/edit`,
  categories: '/categories',
  compatibility: '/compatibility',
  cashRegister: '/caja',
  sales: '/ventas',
  users: '/users',
  settings: '/settings',
  search: '/search',
} as const;
