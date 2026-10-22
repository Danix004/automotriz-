import { useMemo, useState } from 'react';
import { Package, Search as SearchIcon, Sparkles, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { ProductCard } from '@/components/shared/ProductCard';
import { useCategoriesOptions, useSearchQuery } from '@/hooks/queries';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { formatNumber } from '@/utils/format';

const FILTER_KEYS = ['q', 'categoryId', 'availability', 'minPrice', 'maxPrice'];

const EMPTY = {
  q: '',
  categoryId: '',
  availability: '',
  minPrice: '',
  maxPrice: '',
};

const SUGGESTIONS = ['pantalla', 'cámara', 'bujías', ' Suspensión'];

/**
 * Buscador inteligente global: combina texto libre con filtros de
 * producto (categoría, disponibilidad, rango de precio). Todo persiste en la URL.
 */
export function SearchPage() {
  const { filters, setFilter, clearFilters } = useUrlFilters(EMPTY);
  const { data: categories } = useCategoriesOptions();
  const [term, setTerm] = useState(filters.q);

  const params = useMemo(
    () => ({
      q: term.trim(),
      categoryId: filters.categoryId || undefined,
      availability: filters.availability || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
    }),
    [term, filters],
  );

  const { data, isLoading, isError, refetch, isFetching } = useSearchQuery(params);

  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;
  const hasQuery = term.trim().length > 0 || activeCount > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Buscador inteligente"
        description="Combina texto libre con filtros de producto"
        breadcrumbs={[{ label: 'Inicio' }, { label: 'Buscador' }]}
        actions={
          activeCount > 0 ? (
            <Button
              variant="outline"
              icon={<X className="h-4 w-4" />}
              onClick={() => {
                setTerm('');
                clearFilters(FILTER_KEYS);
              }}
            >
              Limpiar búsqueda
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardBody className="space-y-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <Input
              value={term}
              autoFocus
              placeholder="Busca productos: “pantalla 10.1”, “cámara de retroceso”, “bujías”…"
              className="pl-11 text-base"
              onChange={(event) => {
                setTerm(event.target.value);
                setFilter('q', event.target.value);
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400">Sugerencias:</span>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  const value = suggestion.trim();
                  setTerm(value);
                  setFilter('q', value);
                }}
                className="rounded-full border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 transition-colors hover:border-primary hover:text-primary"
              >
                {suggestion.trim()}
              </button>
            ))}
          </div>

          <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filtros de producto</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field label="Categoría" htmlFor="search-category">
                <Select
                  id="search-category"
                  placeholder="Todas"
                  value={filters.categoryId}
                  onChange={(event) => setFilter('categoryId', event.target.value)}
                >
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Disponibilidad" htmlFor="search-availability">
                <Select
                  id="search-availability"
                  placeholder="Todos"
                  value={filters.availability}
                  onChange={(event) => setFilter('availability', event.target.value)}
                >
                  <option value="in">En stock</option>
                  <option value="out">Sin stock</option>
                  <option value="promo">En promoción</option>
                </Select>
              </Field>
              <Field label="Precio mínimo" htmlFor="search-min">
                <Input
                  id="search-min"
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(event) => setFilter('minPrice', event.target.value)}
                />
              </Field>
              <Field label="Precio máximo" htmlFor="search-max">
                <Input
                  id="search-max"
                  type="number"
                  placeholder="1000"
                  value={filters.maxPrice}
                  onChange={(event) => setFilter('maxPrice', event.target.value)}
                />
              </Field>
            </div>
          </div>
        </CardBody>
      </Card>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !hasQuery ? (
        <Card>
          <EmptyState
            icon={<Sparkles className="h-7 w-7" />}
            title="Empieza a buscar"
            description="Escribe un término o combina filtros de producto para ver coincidencias."
          />
        </Card>
      ) : isLoading || !data ? (
        <LoadingState label="Buscando coincidencias…" />
      ) : data.products.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchIcon className="h-7 w-7" />}
            title={`Sin resultados para “${data.query}”`}
            description="Prueba con menos filtros, otra grafía o una palabra más genérica."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setTerm('');
                  clearFilters(FILTER_KEYS);
                }}
              >
                Limpiar búsqueda
              </Button>
            }
          />
        </Card>
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              {formatNumber(data.products.length)} coincidencias para “{data.query}”
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Catálogo de equipamientos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
