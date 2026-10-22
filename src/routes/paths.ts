/** Constantes de rutas (un solo lugar para enlaces y navegación). */

export const paths = {
  home: '/',
  dashboard: '/dashboard',
  products: '/products',
  productNew: '/products/new',
  product: (id: string) => `/products/${id}`,
  productEdit: (id: string) => `/products/${id}/edit`,
  categories: '/categories',
  cashRegister: '/caja',
  sales: '/ventas',
  users: '/users',
  settings: '/settings',
  search: '/search',
} as const;
