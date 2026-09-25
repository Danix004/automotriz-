/** Servicio REST de compatibilidad producto ↔ vehículo. */

import type { Paginated, QueryParams } from '@/types';
import type { CompatibilityEntry } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export interface CompatibilityPayload {
  productId: string;
  vehicleIds: string[];
  notes?: string;
}

export const compatibilityService = {
  list(params: QueryParams = {}): Promise<Paginated<CompatibilityEntry>> {
    return http.get<Paginated<CompatibilityEntry>>(`/compatibility${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<CompatibilityEntry[]> {
    return http
      .get<Paginated<CompatibilityEntry>>(`/compatibility${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  add(payload: CompatibilityPayload): Promise<{ created: number }> {
    return http.post<{ created: number }>('/compatibility', payload);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/compatibility/${id}`);
  },
};
