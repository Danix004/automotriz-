/** DTOs: respuestas enriquecidas que devuelve la API (joins del backend). */

import type {
  AppSettings,
  AppUser,
  Brand,
  Category,
  Compatibility,
  Generation,
  Product,
  ProductImage,
  ProductWithCategory,
  VehicleModel,
  VehicleWithRefs,
} from '@/types';

export interface BrandDetail extends Brand {
  modelCount: number;
  vehicleCount: number;
  models: VehicleModel[];
}

export interface ModelDetail extends VehicleModel {
  brand: Brand;
  generations: Generation[];
  vehicleCount: number;
}

export interface GenerationDetail extends Generation {
  model: VehicleModel;
  brand: Brand;
  vehicleCount: number;
}

export interface CompatibilityEntry extends Compatibility {
  vehicle: VehicleWithRefs;
  product: ProductWithCategory;
}

export interface CompatibilityDto {
  id: string;
  productId: string;
  vehicleId: string;
  notes: string;
  createdAt: string;
}

export interface ProductDetail extends ProductWithCategory {
  images: ProductImage[];
  vehicles: VehicleWithRefs[];
  related: ProductWithCategory[];
}

export interface VehicleDetail extends VehicleWithRefs {
  compatibility: CompatibilityEntry[];
  siblingVersions: VehicleWithRefs[];
  recommended: ProductWithCategory[];
}

export interface CatalogFilters {
  brandId?: string;
  modelId?: string;
  generationId?: string;
  year?: number;
  version?: string;
  engine?: string;
}

export interface DashboardStats {
  totals: {
    vehicles: number;
    brands: number;
    models: number;
    generations: number;
    products: number;
    activeProducts: number;
    outOfStock: number;
    lowStock: number;
    categories: number;
    compatibility: number;
    users: number;
  };
  monthly: Array<{ month: string; vehicles: number; products: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  brandDistribution: Array<{ name: string; value: number }>;
  fuelDistribution: Array<{ name: string; value: number }>;
  stockStatus: Array<{ name: string; value: number }>;
  priceRange: Array<{ range: string; value: number }>;
  recentProducts: ProductWithCategory[];
  recentVehicles: VehicleWithRefs[];
}

export interface SearchResult {
  vehicles: VehicleWithRefs[];
  products: ProductWithCategory[];
  total: number;
  query: string;
}

export interface SettingsResponse {
  settings: AppSettings;
  users: AppUser[];
}

export type { Brand, Category, Product, VehicleModel, Generation, Compatibility };
