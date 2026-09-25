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
