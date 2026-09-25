/**
 * Cliente HTTP único de la aplicación.
 *
 * - Sin `VITE_API_URL`: usa el mock local (seed + localStorage) con latencia simulada.
 * - Con `VITE_API_URL`: hace fetch real contra `${VITE_API_URL}${path}`.
 *   Ejemplos: `/api` (mismo origen en Vercel) o `https://api.tudominio.com/api`.
 *
 * Los servicios nunca conocen el detalle: cambiar de backend no toca UI ni hooks.
 */

import { ApiError } from '@/utils/errors';
import { mockRequest } from '@/services/mockApi';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const RAW_URL = import.meta.env.VITE_API_URL ?? '';
const BASE_URL = RAW_URL.replace(/\/$/, '');

/** Indica si la app apunta a una API remota real. */
export const isRemoteApi = BASE_URL.length > 0;

/** Rutas relativas al prefijo de la API (p. ej. `/brands?page=1`). */
export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  if (!isRemoteApi) {
    return mockRequest<T>(method, `/api${path}`, body);
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('autoequip.token');
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Error ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

/** Serializa parámetros de consulta omitiendo los vacíos. */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}
