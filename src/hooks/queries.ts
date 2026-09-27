/** Consultas TanStack Query del catálogo. */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import type {
  AppSettings,
  AppUser,
  Brand,
  Category,
  Generation,
  Paginated,
  Product,
  QueryParams,
  Sale,
  SaleInput,
  SaleWithItems,
  SalesReport,
  Vehicle,
  VehicleModel,
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
import { brandService } from '@/services/brandService';
import { generationService, modelService } from '@/services/modelService';
import { vehicleService } from '@/services/vehicleService';
import { categoryService, productService } from '@/services/productService';
import { compatibilityService, type CompatibilityPayload } from '@/services/compatibilityService';
import { saleService } from '@/services/saleService';
import { dashboardService, searchService, settingsService, userService, type SearchParams } from '@/services';
import { queryKeys, CATALOG_KEYS } from '@/hooks/keys';

/* ----------------------------- marcas ----------------------------- */

export function useBrands(params: QueryParams = {}): UseQueryResult<Paginated<BrandDetail>> {
  return useQuery({
    queryKey: queryKeys.brands(params),
    queryFn: () => brandService.list({ ...params, detail: true }),
  });
}

export function useBrandsOptions(): UseQueryResult<BrandDetail[]> {
  return useQuery({
    queryKey: queryKeys.brands({ options: true }),
    queryFn: () => brandService.listAll({ sortField: 'name' }),
    staleTime: 60_000,
  });
}

export function useBrand(id: string | undefined): UseQueryResult<BrandDetail> {
  return useQuery({
    queryKey: queryKeys.brand(id ?? ''),
    queryFn: () => brandService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useBrandMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['brands'] });
  const invalidateAll = () => CATALOG_KEYS.forEach((key) => client.invalidateQueries({ queryKey: key }));

  return {
    create: useMutation({
      mutationFn: (data: Partial<Brand>) => brandService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) => brandService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => brandService.remove(id),
      onSuccess: invalidateAll,
    }),
  };
}

/* ---------------------------- modelos ---------------------------- */

export function useModels(params: QueryParams = {}): UseQueryResult<Paginated<ModelDetail>> {
  return useQuery({
    queryKey: queryKeys.models(params),
    queryFn: () => modelService.list(params),
  });
}

export function useModelsByBrand(brandId: string | undefined): UseQueryResult<Paginated<VehicleModel>> {
  return useQuery({
    queryKey: queryKeys.models({ brandId }),
    queryFn: () => modelService.listByBrand(brandId as string, { pageSize: 0, sortField: 'name' }),
    enabled: Boolean(brandId),
  });
}

export function useModelMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['models'] });
  return {
    create: useMutation({
      mutationFn: (data: Partial<VehicleModel>) => modelService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<VehicleModel> }) => modelService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => modelService.remove(id),
      onSuccess: () => CATALOG_KEYS.forEach((key) => client.invalidateQueries({ queryKey: key })),
    }),
  };
}

/* -------------------------- generaciones ------------------------- */

export function useGenerations(params: QueryParams = {}): UseQueryResult<Paginated<GenerationDetail>> {
  return useQuery({
    queryKey: queryKeys.generations(params),
    queryFn: () => generationService.list(params),
  });
}

export function useGenerationsByModel(modelId: string | undefined): UseQueryResult<GenerationDetail[]> {
  return useQuery({
    queryKey: queryKeys.generations({ modelId }),
    queryFn: () => generationService.listByModel(modelId as string),
    enabled: Boolean(modelId),
  });
}

export function useGenerationMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['generations'] });
  return {
    create: useMutation({
      mutationFn: (data: Partial<Generation>) => generationService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Generation> }) =>
        generationService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => generationService.remove(id),
      onSuccess: () => CATALOG_KEYS.forEach((key) => client.invalidateQueries({ queryKey: key })),
    }),
  };
}

/* -------------------------- vehículos ---------------------------- */

export function useVehicles(params: QueryParams = {}): UseQueryResult<Paginated<VehicleWithRefsList>> {
  return useQuery({
    queryKey: queryKeys.vehicles(params),
    queryFn: () => vehicleService.list(params),
  });
}

type VehicleWithRefsList = Awaited<ReturnType<typeof vehicleService.list>>['items'][number];

export function useVehicle(id: string | undefined): UseQueryResult<VehicleDetail> {
  return useQuery({
    queryKey: queryKeys.vehicle(id ?? ''),
    queryFn: () => vehicleService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useVehicleMutations() {
  const client = useQueryClient();
  const invalidate = () =>
    CATALOG_KEYS.forEach((key) => client.invalidateQueries({ queryKey: key }));
  return {
    create: useMutation({
      mutationFn: (data: Partial<Vehicle>) => vehicleService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => vehicleService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => vehicleService.remove(id),
      onSuccess: invalidate,
    }),
  };
}

/* -------------------------- productos ---------------------------- */

export function useProducts(params: QueryParams = {}): UseQueryResult<Paginated<ProductWithCategoryList>> {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productService.list(params),
  });
}

type ProductWithCategoryList = Awaited<ReturnType<typeof productService.list>>['items'][number];

export function useProduct(id: string | undefined): UseQueryResult<ProductDetail> {
  return useQuery({
    queryKey: queryKeys.product(id ?? ''),
    queryFn: () => productService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useProductMutations() {
  const client = useQueryClient();
  const invalidate = () =>
    CATALOG_KEYS.forEach((key) => client.invalidateQueries({ queryKey: key }));
  return {
    create: useMutation({
      mutationFn: (data: Partial<Product>) => productService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) => productService.update(id, data),
      onSuccess: invalidate,
    }),
    duplicate: useMutation({
      mutationFn: (id: string) => productService.duplicate(id),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => productService.remove(id),
      onSuccess: invalidate,
    }),
  };
}

/* ------------------------- categorías ---------------------------- */

export function useCategories(params: QueryParams = {}): UseQueryResult<Paginated<Category>> {
  return useQuery({
    queryKey: queryKeys.categories(params),
    queryFn: () => categoryService.list(params),
  });
}

export function useCategoriesOptions(): UseQueryResult<Category[]> {
  return useQuery({
    queryKey: queryKeys.categories({ options: true }),
    queryFn: () => categoryService.listAll({ sortField: 'name' }),
    staleTime: 60_000,
  });
}

export function useCategoryMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['categories'] });
  return {
    create: useMutation({
      mutationFn: (data: Partial<Category>) => categoryService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) => categoryService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => categoryService.remove(id),
      onSuccess: () =>
        [queryKeys.all.categories, queryKeys.all.products, queryKeys.all.dashboard].forEach((key) =>
          client.invalidateQueries({ queryKey: key }),
        ),
    }),
  };
}

/* ----------------------- compatibilidad -------------------------- */

export function useCompatibility(params: QueryParams = {}): UseQueryResult<Paginated<CompatibilityEntry>> {
  return useQuery({
    queryKey: queryKeys.compatibility(params),
    queryFn: () => compatibilityService.list(params),
  });
}

export function useCompatibilityMutations() {
  const client = useQueryClient();
  const invalidate = () =>
    [queryKeys.all.compatibility, queryKeys.all.products, queryKeys.all.dashboard, queryKeys.all.search].forEach(
      (key) => client.invalidateQueries({ queryKey: key }),
    );
  return {
    add: useMutation({
      mutationFn: (payload: CompatibilityPayload) => compatibilityService.add(payload),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => compatibilityService.remove(id),
      onSuccess: invalidate,
    }),
  };
}

/* ------------------------ dashboard/buscar ----------------------- */

export function useDashboardStats(): UseQueryResult<DashboardStats> {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.stats,
    refetchOnWindowFocus: false,
  });
}

export function useSearchQuery(params: SearchParams): UseQueryResult<SearchResult> {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => searchService.query(params),
    enabled: params.q.trim().length > 0 || Boolean(params.brandId) || Boolean(params.year),
  });
}

/* ------------------------- usuarios/ajustes ---------------------- */

export function useUsers(params: QueryParams = {}): UseQueryResult<Paginated<AppUser>> {
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => userService.list(params),
  });
}

export function useSettings(): UseQueryResult<AppSettings> {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: settingsService.get,
    staleTime: 60_000,
  });
}

/* --------------------------- usuarios ---------------------------- */

export function useUserMutations() {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.all.users });
  return {
    create: useMutation({
      mutationFn: (data: Partial<AppUser>) => userService.create(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: Partial<AppUser> }) => userService.update(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => userService.remove(id),
      onSuccess: invalidate,
    }),
  };
}

export function useSettingsMutation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => settingsService.update(data),
    onSuccess: (settings) => client.setQueryData(queryKeys.settings, settings),
  });
}

/* --------------------------- caja/ventas --------------------------- */

export function useSales(params: QueryParams = {}): UseQueryResult<Paginated<Sale>> {
  return useQuery({
    queryKey: queryKeys.sales(params),
    queryFn: () => saleService.list(params),
  });
}

export function useSale(id: string | undefined): UseQueryResult<SaleWithItems> {
  return useQuery({
    queryKey: queryKeys.sale(id ?? ''),
    queryFn: () => saleService.get(id as string),
    enabled: Boolean(id),
  });
}

export function useSalesReport(params: QueryParams = {}): UseQueryResult<SalesReport> {
  return useQuery({
    queryKey: queryKeys.salesReport(params),
    queryFn: () => saleService.report(params),
  });
}

/**
 * Registrar una venta desde la caja. Al confirmarse hay que refrescar
 * el listado, el informe, el dashboard y los productos (descuento de stock).
 */
export function useCreateSale() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: SaleInput) => saleService.create(data),
    onSuccess: () =>
      [queryKeys.all.sales, queryKeys.all.salesReport, queryKeys.all.dashboard, queryKeys.all.products].forEach(
        (key) => client.invalidateQueries({ queryKey: key }),
      ),
  });
}
