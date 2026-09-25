/** Servicio REST de modelos y generaciones. */

import type { Generation, Paginated, QueryParams, VehicleModel } from '@/types';
import type { GenerationDetail, ModelDetail } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export const modelService = {
  list(params: QueryParams = {}): Promise<Paginated<ModelDetail>> {
    return http.get<Paginated<ModelDetail>>(`/models${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<ModelDetail[]> {
    return http
      .get<Paginated<ModelDetail>>(`/models${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  listByBrand(brandId: string, params: QueryParams = {}): Promise<Paginated<VehicleModel>> {
    return http.get<Paginated<VehicleModel>>(`/models${buildQuery({ ...params, brandId })}`);
  },

  get(id: string): Promise<ModelDetail> {
    return http.get<ModelDetail>(`/models/${id}`);
  },

  create(data: Partial<VehicleModel>): Promise<VehicleModel> {
    return http.post<VehicleModel>('/models', data);
  },

  update(id: string, data: Partial<VehicleModel>): Promise<VehicleModel> {
    return http.put<VehicleModel>(`/models/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/models/${id}`);
  },
};

export const generationService = {
  list(params: QueryParams = {}): Promise<Paginated<GenerationDetail>> {
    return http.get<Paginated<GenerationDetail>>(`/generations${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<GenerationDetail[]> {
    return http
      .get<Paginated<GenerationDetail>>(`/generations${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  listByModel(modelId: string): Promise<GenerationDetail[]> {
    return http
      .get<Paginated<GenerationDetail>>(`/generations${buildQuery({ modelId, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  get(id: string): Promise<GenerationDetail> {
    return http.get<GenerationDetail>(`/generations/${id}`);
  },

  create(data: Partial<Generation>): Promise<Generation> {
    return http.post<Generation>('/generations', data);
  },

  update(id: string, data: Partial<Generation>): Promise<Generation> {
    return http.put<Generation>(`/generations/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/generations/${id}`);
  },
};
