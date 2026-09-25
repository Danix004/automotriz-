/** Helpers para construir parámetros de listado comunes. */

import { useCallback, useMemo } from 'react';
import type { QueryParams, SortDirection } from '@/types';
import { useUrlFilters, type FilterValue } from '@/hooks/useUrlFilters';
import { useDebouncedValue } from '@/utils/effects';

export interface ListStateOptions {
  defaults?: Record<string, FilterValue>;
  extraDefaults?: Record<string, FilterValue>;
  searchKeys?: string[];
}

/**
 * Estado de tabla paginada + búsqueda con debounce + orden,
 * todo persistido en la URL. Reutilizable por cualquier listado.
 */
export function useListState(options: ListStateOptions = {}) {
  const defaults = useMemo(
    () => ({ q: '', page: 1, pageSize: 10, sortField: '', sortDirection: 'asc', ...(options.defaults ?? {}) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const { filters, setFilter, setFilters, clearFilters, page, pageSize, search, sortField, sortDirection } =
    useUrlFilters(defaults);

  const debouncedSearch = useDebouncedValue(search, 350);

  const queryParams: QueryParams = useMemo(() => {
    const params: QueryParams = { page, pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sortField) {
      params.sortField = sortField;
      params.sortDirection = sortDirection as SortDirection;
    }
    Object.entries(options.extraDefaults ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') params[key] = value as string;
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'q' || key === 'page' || key === 'pageSize' || key === 'sortField' || key === 'sortDirection')
        return;
      if (value) params[key] = value;
    });
    return params;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, debouncedSearch, sortField, sortDirection, filters, options.extraDefaults]);

  const toggleSort = useCallback(
    (field: string) => {
      if (sortField !== field) setFilters({ sortField: field, sortDirection: 'asc' });
      else if (sortDirection === 'asc') setFilter('sortDirection', 'desc');
      else setFilters({ sortField: '', sortDirection: 'asc' });
    },
    [sortField, sortDirection, setFilter, setFilters],
  );

  const setPage = useCallback((value: number) => setFilter('page', value, { resetPage: false }), [setFilter]);
  const setPageSize = useCallback((value: number) => setFilter('pageSize', value), [setFilter]);
  const setSearch = useCallback((value: string) => setFilter('q', value), [setFilter]);

  const hasFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'page' && key !== 'pageSize' && key !== 'sortDirection' && Boolean(value),
  );

  return {
    filters,
    search,
    debouncedSearch,
    page,
    pageSize,
    sortField,
    sortDirection: sortDirection as SortDirection,
    queryParams,
    setFilter,
    setFilters,
    clearFilters,
    toggleSort,
    setPage,
    setPageSize,
    setSearch,
    hasFilters,
  };
}
