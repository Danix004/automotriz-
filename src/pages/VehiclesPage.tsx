import { Link, useNavigate } from 'react-router-dom';
import { Car, Filter, Plus, Rows3, Grid2x2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { CardSkeleton, EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { VehicleCard } from '@/components/shared/VehicleCard';
import { VehicleFilters, useVehicleFilters } from '@/features/vehicles/VehicleFilters';
import { useListState } from '@/hooks/useListState';
import { useVehicles } from '@/hooks/queries';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { VehicleWithRefs } from '@/types';

type ViewMode = 'grid' | 'table';

export function VehiclesPage() {
  const navigate = useNavigate();
  const list = useListState({ defaults: { q: '' } });
  const { queryParams, activeCount } = useVehicleFilters();
  const [view, setView] = useState<ViewMode>('grid');

  const params = useMemo(
    () => ({
      ...list.queryParams,
      ...queryParams,
      search: list.debouncedSearch || undefined,
      sortField: list.sortField || 'year',
      sortDirection: list.sortDirection,
    }),
    [list.queryParams, queryParams, list.debouncedSearch, list.sortField, list.sortDirection],
  );

  const { data, isLoading, isError, refetch } = useVehicles(params);

  const columns: Array<Column<VehicleWithRefs>> = [
    {
      key: 'vehicle',
      header: 'Vehículo',
      accessor: (vehicle) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">
            {vehicle.brand?.name} {vehicle.model?.name}{' '}
            <span className="text-slate-500">{vehicle.year}</span>
          </p>
          <p className="truncate text-xs text-slate-500">
            {vehicle.generation?.name} · {vehicle.version}
          </p>
        </div>
      ),
    },
    { key: 'engine', header: 'Motor', hideOn: 'md', accessor: (vehicle) => vehicle.engine },
    { key: 'fuel', header: 'Combustible', hideOn: 'lg', accessor: (vehicle) => <Badge variant="info">{vehicle.fuel}</Badge> },
    { key: 'transmission', header: 'Transmisión', hideOn: 'xl', accessor: (vehicle) => vehicle.transmission },
    { key: 'power', header: 'Potencia', sortable: true, align: 'right', hideOn: 'xl', accessor: (vehicle) => `${vehicle.power} hp` },
    { key: 'active', header: 'Estado', sortable: true, accessor: (vehicle) => <StatusBadge active={vehicle.active} /> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Catálogo de vehículos"
        description={`${formatNumber(data?.total ?? 0)} vehículos según la selección actual`}
        breadcrumbs={[{ label: 'Catálogo' }, { label: 'Vehículos' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate(paths.vehicleNew)}>
            Nuevo vehículo
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={list.search}
          onValueChange={list.setSearch}
          placeholder="Buscar por marca, modelo, versión o motor…"
          className="sm:max-w-md"
        />
        <div className="flex items-center gap-1 sm:ml-auto">
          <span className="mr-2 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
            <Filter className="h-3.5 w-3.5" /> {activeCount} filtros activos
          </span>
          <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5">
            <button
              type="button"
              aria-label="Vista de tarjetas"
              onClick={() => setView('grid')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'grid' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Vista de tabla"
              onClick={() => setView('table')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                view === 'table' ? 'bg-primary text-white' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              <Rows3 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <VehicleFilters />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <CardSkeleton count={8} />
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70">
          <EmptyState
            icon={<Car className="h-7 w-7" />}
            title="No encontramos vehículos"
            description="Ajusta la selección de marca, modelo, generación o año para ampliar los resultados."
            action={
              <Button variant="outline" onClick={() => list.clearFilters()}>
                Limpiar todo
              </Button>
            }
          />
        </div>
      ) : view === 'grid' ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {data?.items.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
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
        <DataTable<VehicleWithRefs>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(vehicle) => vehicle.id}
          sortField={list.sortField}
          sortDirection={list.sortDirection}
          onSort={list.toggleSort}
          onRowClick={(vehicle) => navigate(paths.vehicle(vehicle.id))}
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

      {(data?.total ?? 0) > 0 && list.hasFilters && (
        <div className="flex justify-end">
          <Link to={paths.search} className="text-xs font-medium text-primary hover:underline">
            ¿Buscas compatibilidades? Usa el buscador global →
          </Link>
        </div>
      )}
    </div>
  );
}
