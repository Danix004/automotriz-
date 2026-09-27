/** Servicio REST de caja y ventas. */

import type { Paginated, QueryParams, Sale, SaleInput, SaleWithItems, SalesReport } from '@/types';
import { http, buildQuery } from '@/services/client';

export const saleService = {
  list(params: QueryParams = {}): Promise<Paginated<Sale>> {
    return http.get<Paginated<Sale>>(`/sales${buildQuery(params)}`);
  },

  get(id: string): Promise<SaleWithItems> {
    return http.get<SaleWithItems>(`/sales/${id}`);
  },

  create(data: SaleInput): Promise<SaleWithItems> {
    return http.post<SaleWithItems>('/sales', data);
  },

  report(params: QueryParams = {}): Promise<SalesReport> {
    return http.get<SalesReport>(`/sales/report${buildQuery(params)}`);
  },
};
