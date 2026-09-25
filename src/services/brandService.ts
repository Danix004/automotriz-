/** Servicio REST de marcas: GET/POST/PUT/DELETE /api/brands */

import type { Brand, Paginated, QueryParams } from '@/types';
import type { BrandDetail } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export interface BrandListParams extends QueryParams {
  detail?: boolean;
}

export const brandService = {
  list(params: BrandListParams = {}): Promise<Paginated<BrandDetail>> {
    return http.get<Paginated<BrandDetail>>(`/brands${buildQuery({ ...params })}`);
  },

  listAll(params: BrandListParams = {}): Promise<BrandDetail[]> {
    return http
      .get<Paginated<BrandDetail>>(`/brands${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  get(id: string): Promise<BrandDetail> {
    return http.get<BrandDetail>(`/brands/${id}`);
  },

  getModels(id: string, params: QueryParams = {}): Promise<Paginated<{ id: string; name: string }>> {
    return http.get<Paginated<{ id: string; name: string }>>(`/brands/${id}/models${buildQuery(params)}`);
  },

  create(data: Partial<Brand>): Promise<Brand> {
    return http.post<Brand>('/brands', data);
  },

  update(id: string, data: Partial<Brand>): Promise<Brand> {
    return http.put<Brand>(`/brands/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/brands/${id}`);
  },
};
