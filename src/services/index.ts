/** Servicios de dashboard, buscador global, usuarios y configuración. */

import type { AppSettings, AppUser, Paginated, QueryParams } from '@/types';
import type { DashboardStats, SearchResult } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export const dashboardService = {
  stats(): Promise<DashboardStats> {
    return http.get<DashboardStats>('/dashboard/stats');
  },
};

export interface SearchParams {
  q: string;
  brandId?: string;
  modelId?: string;
  year?: string;
  categoryId?: string;
  availability?: string;
  minPrice?: string;
  maxPrice?: string;
}

export const searchService = {
  query(params: SearchParams): Promise<SearchResult> {
    return http.get<SearchResult>(`/search${buildQuery({ ...params })}`);
  },
};

export const userService = {
  list(params: QueryParams = {}): Promise<Paginated<AppUser>> {
    return http.get<Paginated<AppUser>>(`/users${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<AppUser[]> {
    return http
      .get<Paginated<AppUser>>(`/users${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  create(data: Partial<AppUser>): Promise<AppUser> {
    return http.post<AppUser>('/users', data);
  },

  update(id: string, data: Partial<AppUser>): Promise<AppUser> {
    return http.put<AppUser>(`/users/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/users/${id}`);
  },
};

export const settingsService = {
  get(): Promise<AppSettings> {
    return http.get<AppSettings>('/settings');
  },

  update(data: Partial<AppSettings>): Promise<AppSettings> {
    return http.put<AppSettings>('/settings', data);
  },
};
