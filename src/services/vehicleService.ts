/** Servicio REST de vehículos. */

import type { Paginated, QueryParams, Vehicle, VehicleWithRefs } from '@/types';
import type { ProductWithCategory } from '@/types';
import type { VehicleDetail } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export const vehicleService = {
  list(params: QueryParams = {}): Promise<Paginated<VehicleWithRefs>> {
    return http.get<Paginated<VehicleWithRefs>>(`/vehicles${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<VehicleWithRefs[]> {
    return http
      .get<Paginated<VehicleWithRefs>>(`/vehicles${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  get(id: string): Promise<VehicleDetail> {
    return http.get<VehicleDetail>(`/vehicles/${id}`);
  },

  getProducts(id: string, params: QueryParams = {}): Promise<Paginated<ProductWithCategory>> {
    return http.get<Paginated<ProductWithCategory>>(`/vehicles/${id}/products${buildQuery(params)}`);
  },

  create(data: Partial<Vehicle>): Promise<Vehicle> {
    return http.post<Vehicle>('/vehicles', data);
  },

  update(id: string, data: Partial<Vehicle>): Promise<Vehicle> {
    return http.put<Vehicle>(`/vehicles/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/vehicles/${id}`);
  },
};
