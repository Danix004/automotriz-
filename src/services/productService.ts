/** Servicio REST de productos/equipamientos. */

import type { Category, Paginated, Product, ProductWithCategory, QueryParams } from '@/types';
import type { ProductDetail } from '@/types/dto';
import { http, buildQuery } from '@/services/client';

export const productService = {
  list(params: QueryParams = {}): Promise<Paginated<ProductWithCategory>> {
    return http.get<Paginated<ProductWithCategory>>(`/products${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<ProductWithCategory[]> {
    return http
      .get<Paginated<ProductWithCategory>>(`/products${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  get(id: string): Promise<ProductDetail> {
    return http.get<ProductDetail>(`/products/${id}`);
  },

  create(data: Partial<Product>): Promise<Product> {
    return http.post<Product>('/products', data);
  },

  update(id: string, data: Partial<Product>): Promise<Product> {
    return http.put<Product>(`/products/${id}`, data);
  },

  duplicate(id: string): Promise<ProductWithCategory> {
    return http.post<ProductWithCategory>(`/products/${id}/duplicate`);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/products/${id}`);
  },
};

export const categoryService = {
  list(params: QueryParams = {}): Promise<Paginated<Category>> {
    return http.get<Paginated<Category>>(`/categories${buildQuery(params)}`);
  },

  listAll(params: QueryParams = {}): Promise<Category[]> {
    return http
      .get<Paginated<Category>>(`/categories${buildQuery({ ...params, pageSize: 0 })}`)
      .then((page) => page.items);
  },

  create(data: Partial<Category>): Promise<Category> {
    return http.post<Category>('/categories', data);
  },

  update(id: string, data: Partial<Category>): Promise<Category> {
    return http.put<Category>(`/categories/${id}`, data);
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return http.delete<{ ok: boolean }>(`/categories/${id}`);
  },
};
