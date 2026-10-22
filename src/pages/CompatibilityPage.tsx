import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Link2, Package, Plus, Search, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Textarea } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, LoadingState, NoResults } from '@/components/ui/States';
import { CompatibilitySelector } from '@/features/compatibility/CompatibilitySelector';
import { useCompatibility, useCompatibilityMutations, useProducts, useVehicle } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { useDebouncedValue } from '@/utils/effects';
import { formatCurrency, formatDate } from '@/utils/format';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';
import type { CompatibilityEntry } from '@/types/dto';

export function CompatibilityPage() {
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('productId') ?? '';
  const vehicleFilterId = searchParams.get('vehicleId') ?? '';

  const list = useListState({ defaults: { q: '' } });
  const [productId, setProductId] = useState(preselectedProductId);
  const [vehicleIds, setVehicleIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [productTerm, setProductTerm] = useState('');
  const [deleting, setDeleting] = useState<CompatibilityEntry | null>(null);

  const debouncedProductTerm = useDebouncedValue(productTerm, 350);

  useEffect(() => {
    if (preselectedProductId) setProductId(preselectedProductId);
  }, [preselectedProductId]);

  const { data: productResults, isLoading: loadingProducts } = useProducts({
    search: debouncedProductTerm || undefined,
    pageSize: 12,
    sortField: 'name',
  });

  const mutations = useCompatibilityMutations();

  const compatParams = useMemo(
    () => ({
      ...list.queryParams,
      search: list.debouncedSearch || undefined,
      productId: vehicleFilterId ? undefined : productId || undefined,
      vehicleId: vehicleFilterId || undefined,
    }),
    [list.queryParams, list.debouncedSearch, productId, vehicleFilterId],
  );

  const { data, isLoading, isError, refetch } = useCompatibility(compatParams);
  const { data: filteredVehicle } = useVehicle(vehicleFilterId || undefined);

  const selectedProductItem = productResults?.items.find((item) => item.id === productId);

  const canSubmit = Boolean(productId) && vehicleIds.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutations.add.mutate(
      { productId, vehicleIds, notes },
      {
        onSuccess: (result) => {
          toast.success(
            'Compatibilidad registrada',
            `${result.created} vehículo(s) asociados al producto${result.created === 0 ? ' (ya existían)' : ''}.`,
          );
          setVehicleIds([]);
          setNotes('');
          void refetch();
        },
        onError: (error) => toast.error('No se pudo guardar', getErrorMessage(error)),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    mutations.remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Compatibilidad eliminada', 'La relación producto ↔ vehículo fue removida.');
        setDeleting(null);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setDeleting(null);
      },
    });
  };

  const columns: Array<Column<CompatibilityEntry>> = [
    {
      key: 'product',
      header: 'Producto',
      accessor: (entry) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{entry.product?.name ?? '—'}</p>
          <p className="truncate text-xs text-slate-500">{entry.product?.sku}</p>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehículo',
      accessor: (entry) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-800 dark:text-slate-100">
            {entry.vehicle?.brand?.name} {entry.vehicle?.model?.name}{' '}
            <span className="text-slate-500">{entry.vehicle?.year}</span>
          </p>
          <p className="truncate text-xs text-slate-500">
            {entry.vehicle?.generation?.name} · {entry.vehicle?.version}
          </p>
        </div>
      ),
    },
    { key: 'notes', header: 'Notas', hideOn: 'lg', accessor: (entry) => entry.notes || '—' },
    { key: 'createdAt', header: 'Creada', sortable: true, hideOn: 'xl', accessor: (entry) => formatDate(entry.createdAt) },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (entry) => (
        <button
          type="button"
          aria-label="Eliminar compatibilidad"
          onClick={() => setDeleting(entry)}
          className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compatibilidades"
        description="Relaciona productos con los vehículos donde pueden instalarse"
        breadcrumbs={[{ label: 'Equipamientos' }, { label: 'Compatibilidades' }]}
        actions={
          <Badge variant="primary">
            <Link2 className="h-3.5 w-3.5" /> {data?.total ?? 0} relaciones
          </Badge>
        }
      />

      {filteredVehicle && (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Productos compatibles con {filteredVehicle.brand?.name} {filteredVehicle.model?.name}{' '}
                {filteredVehicle.year} {filteredVehicle.version}
              </p>
              <p className="text-xs text-slate-500">Filtrado por el enlace desde la ficha del vehículo.</p>
            </div>
            <Link to={paths.compatibility} className="text-xs font-medium text-primary hover:underline">
              Quitar filtro de vehículo
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Agregar compatibilidad */}
      <Card>
        <CardHeader
          title="Agregar compatibilidad"
          description="1) Elige el producto · 2) Selecciona los vehículos compatibles"
        />
        <CardBody className="space-y-5">
          {/* Selector de producto */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={productTerm}
                onValueChange={setProductTerm}
                placeholder="Buscar producto por nombre, SKU o categoría…"
                className="sm:max-w-md"
              />
              {productId && (
                <Button variant="ghost" size="sm" onClick={() => setProductId('')}>
                  Cambiar producto
                </Button>
              )}
            </div>

            {productId ? (
              <SelectedProductCard productId={productId} />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {loadingProducts && <LoadingState label="Cargando productos…" className="col-span-full" />}
                {productResults?.items.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => setProductId(product.id)}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{product.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {product.sku} · {formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selector de vehículos */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <CompatibilitySelector value={vehicleIds} onChange={setVehicleIds} />
          </div>

          <Field label="Notas (opcional)" htmlFor="compat-notes" hint="Ej. Requiere marco específico">
            <Textarea
              id="compat-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Observaciones sobre esta relación…"
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {vehicleIds.length} vehículo(s) seleccionado(s)
              {selectedProductItem ? ` · ${selectedProductItem.name}` : ''}
            </p>
            <Button icon={<Plus className="h-4 w-4" />} disabled={!canSubmit} loading={mutations.add.isPending} onClick={handleSubmit}>
              Agregar compatibilidad
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Listado */}
      <Card>
        <CardHeader title="Compatibilidades registradas" description="Consulta, filtra y elimina relaciones" />
        <div className="space-y-3 px-4 pt-4">
          <SearchInput
            value={list.search}
            onValueChange={list.setSearch}
            placeholder="Buscar por producto o vehículo…"
            className="max-w-md"
          />
        </div>
        <CardBody className="pt-3">
          {isError ? (
            <ErrorState onRetry={() => void refetch()} />
          ) : (
            <DataTable<CompatibilityEntry>
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(entry) => entry.id}
              loading={isLoading}
              sortField={list.sortField}
              sortDirection={list.sortDirection}
              onSort={list.toggleSort}
              empty={
                list.hasFilters ? (
                  <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
                ) : (
                  <EmptyState
                    icon={<Package className="h-7 w-7" />}
                    title="Sin compatibilidades"
                    description="Asocia un producto con uno o varios vehículos usando el formulario superior."
                  />
                )
              }
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
        </CardBody>
      </Card>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar compatibilidad?"
        message={`Se removerá la relación entre “${deleting?.product?.name}” y “${deleting?.vehicle?.brand?.name} ${deleting?.vehicle?.model?.name} ${deleting?.vehicle?.year}”.`}
        loading={mutations.remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function SelectedProductCard({ productId }: { productId: string }) {
  const { data, isLoading } = useProducts({ pageSize: 0 });
  const product = data?.items.find((item) => item.id === productId);

  if (isLoading) return <LoadingState label="Cargando producto…" />;
  if (!product) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        <Search className="h-4 w-4" /> El producto seleccionado ya no existe.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{product.name}</p>
        <p className="truncate text-xs text-slate-500">
          {product.sku} · {product.category.name} · {formatCurrency(product.price)}
        </p>
      </div>
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
        <Check className="h-3.5 w-3.5" /> Seleccionado
      </span>
      <StatusBadge active={product.active} />
    </div>
  );
}
