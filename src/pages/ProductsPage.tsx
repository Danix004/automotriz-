import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid2x2, Package, Plus, Rows3 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { Select, Input } from '@/components/ui/Input';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { CardSkeleton, EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { Badge, StatusBadge, StockBadge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/shared/ProductCard';
import { useCategoriesOptions, useProducts, useSettings } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { formatCurrency, formatNumber } from '@/utils/format';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';
import type { ProductWithCategory } from '@/types';

type ViewMode = 'grid' | 'table';

export function ProductsPage() {
  const navigate = useNavigate();
  const list = useListState({ defaults: { q: '', categoryId: '', availability: '', minPrice: '', maxPrice: '' } });
  const { data: categories } = useCategoriesOptions();
  const { data: settings } = useSettings();
  const [view, setView] = useState<ViewMode>('grid');

  const params = useMemo(
    () => ({ ...list.queryParams, search: list.debouncedSearch || undefined }),
    [list.queryParams, list.debouncedSearch],
  );
  const { data, isLoading, isError, refetch } = useProducts(params);

  const activeFilters = [list.filters.q, list.filters.categoryId, list.filters.availability, list.filters.minPrice, list.filters.maxPrice]
    .filter(Boolean).length;

  const columns: Array<Column<ProductWithCategory>> = [
    {
      key: 'name',
      header: 'Producto',
      sortable: true,
      accessor: (product) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{product.name}</p>
          <p className="truncate text-xs text-slate-500">
            {product.sku} · {product.brand}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      sortable: true,
      hideOn: 'md',
      accessor: (product) => <Badge variant="info">{product.category.name}</Badge>,
    },
    {
      key: 'price',
      header: 'Precio',
      sortable: true,
      align: 'right',
      accessor: (product) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {formatCurrency(product.promotionalPrice ?? product.price, settings?.currency ?? 'USD')}
        </span>
      ),
    },
    { key: 'stock', header: 'Stock', sortable: true, align: 'center', accessor: (product) => <StockBadge stock={product.stock} /> },
    { key: 'active', header: 'Estado', sortable: true, accessor: (product) => <StatusBadge active={product.active} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Equipamientos y accesorios"
        description={`${formatNumber(data?.total ?? 0)} productos en el catálogo`}
        breadcrumbs={[{ label: 'Equipamientos' }, { label: 'Productos' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(paths.productNew)}>
            Nuevo producto
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={list.search}
          onValueChange={list.setSearch}
          placeholder="Buscar por nombre, SKU, marca o categoría…"
          className="sm:max-w-md"
        />
        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
            {activeFilters} filtros
          </span>
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5">
            <button
              type="button"
              aria-label="Vista de tarjetas"
              onClick={() => setView('grid')}
              className={cn('rounded-md p-1.5 transition-colors', view === 'grid' ? 'bg-primary text-white' : 'text-slate-400')}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Vista de tabla"
              onClick={() => setView('table')}
              className={cn('rounded-md p-1.5 transition-colors', view === 'table' ? 'bg-primary text-white' : 'text-slate-400')}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <FilterPanel
        title="Filtros de productos"
        activeCount={activeFilters}
        onClear={() => list.clearFilters(['q', 'categoryId', 'availability', 'minPrice', 'maxPrice'])}
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Categoría</label>
          <Select
            placeholder="Todas"
            value={list.filters.categoryId}
            onChange={(event) => list.setFilter('categoryId', event.target.value)}
          >
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Disponibilidad</label>
          <Select
            placeholder="Todos"
            value={list.filters.availability}
            onChange={(event) => list.setFilter('availability', event.target.value)}
          >
            <option value="in">En stock</option>
            <option value="out">Sin stock</option>
            <option value="promo">En promoción</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Precio mínimo</label>
          <Input
            type="number"
            placeholder="0"
            value={list.filters.minPrice}
            onChange={(event) => list.setFilter('minPrice', event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Precio máximo</label>
          <Input
            type="number"
            placeholder="1000"
            value={list.filters.maxPrice}
            onChange={(event) => list.setFilter('maxPrice', event.target.value)}
          />
        </div>
      </FilterPanel>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <CardSkeleton count={8} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <EmptyState
            icon={<Package className="h-7 w-7" />}
            title="No hay productos"
            description="Cambia los filtros o agrega un nuevo equipamiento al catálogo."
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => list.clearFilters()}>
                  Limpiar filtros
                </Button>
                <Button onClick={() => navigate(paths.productNew)}>Nuevo producto</Button>
              </div>
            }
          />
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} admin />
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
            <Pagination
              page={data?.page ?? 1}
              pageSize={data?.pageSize ?? list.pageSize}
              total={data?.total ?? 0}
              totalPages={data?.totalPages ?? 1}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          </div>
        </>
      ) : (
        <DataTable<ProductWithCategory>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(product) => product.id}
          sortField={list.sortField}
          sortDirection={list.sortDirection}
          onSort={list.toggleSort}
          onRowClick={(product) => navigate(paths.product(product.id))}
          empty={<NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />}
          pagination={{
            page: data?.page ?? 1,
            pageSize: data?.pageSize ?? list.pageSize,
            total: data?.total ?? 0,
            totalPages: data?.totalPages ?? 1,
            onPageChange: list.setPage,
            onPageSizeChange: list.setPageSize,
          }}
        />
      )}

      <p className="text-center text-xs text-slate-400">
        Puedes combinar la búsqueda con{' '}
        <button
          type="button"
          className="font-medium text-primary hover:underline"
          onClick={() => toast.info('Buscador inteligente', 'Usa el buscador global para combinar texto y filtros.')}
        >
          el buscador global
        </button>{' '}
        para afinar los resultados.
      </p>
    </div>
  );
}
