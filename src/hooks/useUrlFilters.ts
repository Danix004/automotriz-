/** Utilidades de URL: filtros persistidos en query params. */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '@/types/constants';

export type FilterValue = string | number | boolean | null | undefined;

/**
 * Sincroniza los filtros de una vista con la URL:
 * - refrescar o compartir el enlace conserva el estado.
 * - "limpiar filtros" solo borra los params indicados.
 */
export function useUrlFilters(defaults: Record<string, FilterValue> = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    Object.keys(defaults).forEach((key) => {
      const value = searchParams.get(key);
      result[key] = value ?? (defaults[key] === null || defaults[key] === undefined ? '' : String(defaults[key]));
    });
    return result;
  }, [searchParams, defaults]);

  const setFilter = useCallback(
    (key: string, value: FilterValue, options?: { resetPage?: boolean }) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const shouldReset = options?.resetPage ?? true;
          if (value === null || value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
          if (shouldReset && key !== 'page') next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setFilters = useCallback(
    (values: Record<string, FilterValue>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(values).forEach(([key, value]) => {
            if (value === null || value === undefined || value === '') next.delete(key);
            else next.set(key, String(value));
          });
          if (!('page' in values)) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(
    (keys?: string[]) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const targets = keys ?? Object.keys(defaults);
          targets.forEach((key) => next.delete(key));
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const page = Number(searchParams.get('page') ?? 1) || 1;
  const pageSize = Number(searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
  const search = searchParams.get('q') ?? '';
  const sortField = searchParams.get('sortField') ?? '';
  const sortDirection = (searchParams.get('sortDirection') === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc';

  return { filters, searchParams, setFilter, setFilters, clearFilters, page, pageSize, search, sortField, sortDirection };
}
