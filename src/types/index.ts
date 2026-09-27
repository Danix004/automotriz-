/** Tipos de dominio normalizados del sistema AutoEquip Pro. */

export type EntityStatus = 'active' | 'inactive';

export type FuelType = 'Gasolina' | 'Diésel' | 'Híbrido' | 'Eléctrico' | 'GLP' | 'Flex';
export type TransmissionType =
  | 'Manual'
  | 'Automática'
  | 'CVT'
  | 'Semi-automática'
  | 'DSG'
  | 'DCT'
  | 'S tronic'
  | 'Tiptronic'
  | 'e-CVT';
export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4x4';
export type BodyType =
  | 'Sedán'
  | 'Hatchback'
  | 'SUV'
  | 'Pickup'
  | 'Coupé'
  | 'Convertible'
  | 'Minivan'
  | 'Furgón'
  | 'Crossover'
  | 'Wagon';

/* ------------------------------------------------------------------ */
/* Entidades maestras                                                  */
/* ------------------------------------------------------------------ */

export interface Brand {
  id: string;
  name: string;
  logo: string;
  country: string;
  active: boolean;
  createdAt: string;
}

export interface VehicleModel {
  id: string;
  brandId: string;
  name: string;
  bodyType: BodyType;
  active: boolean;
  createdAt: string;
}

export interface Generation {
  id: string;
  modelId: string;
  name: string;
  startYear: number;
  endYear: number | null;
}

export interface Vehicle {
  id: string;
  generationId: string;
  year: number;
  version: string;
  engine: string;
  fuel: FuelType;
  transmission: TransmissionType;
  drivetrain: DrivetrainType;
  bodyType: BodyType;
  power: number;
  displacement: number;
  image: string;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: number;
  promotionalPrice: number | null;
  stock: number;
  image: string;
  gallery: string[];
  specs: ProductSpec[];
  installation: string;
  tags: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

export interface Compatibility {
  id: string;
  productId: string;
  vehicleId: string;
  notes: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Editor' | 'Visualizador';
  active: boolean;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  currency: string;
  timezone: string;
  lowStockThreshold: number;
  enablePromotions: boolean;
  defaultPageSize: number;
}

/* ------------------------------------------------------------------ */
/* Caja y ventas                                                      */
/* ------------------------------------------------------------------ */

export const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia', 'QR'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  number: string;
  createdAt: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: 'Completada';
  notes: string;
  itemsCount: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

export interface SaleItemInput {
  productId: string;
  quantity: number;
}

export interface SaleInput {
  items: SaleItemInput[];
  paymentMethod: PaymentMethod;
  amountPaid?: number;
  discount?: number;
  notes?: string;
}

export interface SalesReport {
  totals: {
    sales: number;
    units: number;
    revenue: number;
    avgTicket: number;
    today: { sales: number; revenue: number };
  };
  byDay: Array<{ date: string; label: string; sales: number; units: number; revenue: number }>;
  byMethod: Array<{ name: string; sales: number; units: number; revenue: number }>;
  topProducts: Array<{ id: string; name: string; sku: string; units: number; revenue: number; sales: number }>;
}

/* ------------------------------------------------------------------ */
/* Vistas enriquecidas (joins listos para UI)                          */
/* ------------------------------------------------------------------ */

export interface ModelWithBrand extends VehicleModel {
  brand: Brand;
  generationCount: number;
  vehicleCount: number;
}

export interface VehicleRefs {
  generation: Generation;
  model: VehicleModel;
  brand: Brand;
}

export type VehicleWithRefs = Vehicle & VehicleRefs;

export interface ProductWithCategory extends Product {
  category: Category;
  compatibilityCount: number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: string;
  direction: SortDirection;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortField?: string;
  sortDirection?: SortDirection;
  [key: string]: string | number | boolean | undefined;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
