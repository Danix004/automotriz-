import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { Tabs } from '@/components/ui/Feedback';
import { GenerationModal, ModelModal } from '@/features/models/ModelModals';
import {
  useBrandsOptions,
  useGenerationMutations,
  useGenerations,
  useModelMutations,
  useModels,
} from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/store/toastStore';
import type { GenerationDetail, ModelDetail } from '@/types/dto';
import type { GenerationFormValues, ModelFormValues } from '@/schemas';

export function ModelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'generations' ? 'generations' : 'models';

  const list = useListState({ defaults: { q: '', brandId: '' } });
  const { data: brands } = useBrandsOptions();

  const modelQuery = useModels({ ...list.queryParams, search: list.debouncedSearch || undefined });
  const generationQuery = useGenerations({
    ...list.queryParams,
    search: list.debouncedSearch || undefined,
  });

  const modelMutations = useModelMutations();
  const generationMutations = useGenerationMutations();

  const [modelModal, setModelModal] = useState<{ open: boolean; model: ModelDetail | null }>({ open: false, model: null });
  const [generationModal, setGenerationModal] = useState<{ open: boolean; generation: GenerationDetail | null }>({
    open: false,
    generation: null,
  });
  const [deleting, setDeleting] = useState<{ type: 'model' | 'generation'; item: ModelDetail | GenerationDetail } | null>(null);

  const modelsWithBrand = useMemo(
    () => (modelQuery.data?.items ?? []).map((model) => ({ ...model, brandName: model.brand?.name ?? '' })),
    [modelQuery.data],
  );

  const modelOptions = useMemo(
    () => (generationQuery.data?.items ?? []).map((g) => ({ id: g.modelId, name: g.model?.name ?? '', brandName: g.brand?.name })),
    [generationQuery.data],
  );

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'models') next.delete('tab');
    else next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const handleModelSubmit = (values: ModelFormValues, id?: string) => {
    if (id) {
      modelMutations.update.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            toast.success('Modelo actualizado', values.name);
            setModelModal({ open: false, model: null });
          },
          onError: (error) => toast.error('No se pudo actualizar', getErrorMessage(error)),
        },
      );
    } else {
      modelMutations.create.mutate(values, {
        onSuccess: () => {
          toast.success('Modelo creado', `${values.name} se agregó al catálogo.`);
          setModelModal({ open: false, model: null });
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  const handleGenerationSubmit = (values: GenerationFormValues, id?: string) => {
    const payload = { ...values, endYear: values.endYear ? Number(values.endYear) : null };
    if (id) {
      generationMutations.update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success('Generación actualizada', values.name);
            setGenerationModal({ open: false, generation: null });
          },
          onError: (error) => toast.error('No se pudo actualizar', getErrorMessage(error)),
        },
      );
    } else {
      generationMutations.create.mutate(payload, {
        onSuccess: () => {
          toast.success('Generación creada', `${values.name} se agregó.`);
          setGenerationModal({ open: false, generation: null });
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    const onSuccess = () => {
      toast.success('Eliminado', 'El registro fue eliminado correctamente.');
      setDeleting(null);
    };
    const onError = (error: unknown) => {
      toast.error('No se pudo eliminar', getErrorMessage(error));
      setDeleting(null);
    };
    if (deleting.type === 'model') modelMutations.remove.mutate(deleting.item.id, { onSuccess, onError });
    else generationMutations.remove.mutate(deleting.item.id, { onSuccess, onError });
  };

  const modelColumns: Array<Column<ModelDetail>> = [
    {
      key: 'name',
      header: 'Modelo',
      sortable: true,
      accessor: (model) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{model.name}</p>
          <p className="truncate text-xs text-slate-500">{model.brand?.name}</p>
        </div>
      ),
    },
    { key: 'bodyType', header: 'Carrocería', sortable: true, hideOn: 'md', accessor: (model) => model.bodyType },
    { key: 'generations', header: 'Generaciones', hideOn: 'lg', align: 'center', accessor: (model) => model.generations.length },
    { key: 'vehicleCount', header: 'Vehículos', sortable: true, align: 'center', accessor: (model) => model.vehicleCount },
    { key: 'active', header: 'Estado', sortable: true, accessor: (model) => <StatusBadge active={model.active} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (model) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Editar modelo"
            onClick={() => setModelModal({ open: true, model })}
            className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Eliminar modelo"
            onClick={() => setDeleting({ type: 'model', item: model })}
            className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const generationColumns: Array<Column<GenerationDetail>> = [
    {
      key: 'name',
      header: 'Generación',
      sortable: true,
      accessor: (generation) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-white">{generation.name}</p>
          <p className="truncate text-xs text-slate-500">
            {generation.brand?.name} · {generation.model?.name}
          </p>
        </div>
      ),
    },
    {
      key: 'startYear',
      header: 'Rango de años',
      sortable: true,
      accessor: (generation) => `${generation.startYear} – ${generation.endYear ?? 'actual'}`,
    },
    { key: 'vehicleCount', header: 'Vehículos', sortable: true, align: 'center', accessor: (g) => g.vehicleCount },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (generation) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Editar generación"
            onClick={() => setGenerationModal({ open: true, generation })}
            className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Eliminar generación"
            onClick={() => setDeleting({ type: 'generation', item: generation })}
            className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const activeFilters = [list.filters.q, list.filters.brandId].filter(Boolean).length;
  const isLoading = activeTab === 'models' ? modelQuery.isLoading : generationQuery.isLoading;
  const isError = activeTab === 'models' ? modelQuery.isError : generationQuery.isError;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Modelos y generaciones"
        description="Estructura jerárquica: marca → modelo → generación → vehículo"
        breadcrumbs={[{ label: 'Catálogo' }, { label: 'Modelos' }]}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Layers className="h-4 w-4" />}
              onClick={() => setGenerationModal({ open: true, generation: null })}
            >
              Nueva generación
            </Button>
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setModelModal({ open: true, model: null })}
            >
              Nuevo modelo
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={list.search}
          onValueChange={list.setSearch}
          placeholder="Buscar modelo o generación…"
          className="sm:max-w-sm"
        />
      </div>

      <FilterPanel activeCount={activeFilters} onClear={() => list.clearFilters(['q', 'brandId'])}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Marca</label>
          <Select placeholder="Todas las marcas" value={list.filters.brandId} onChange={(event) => list.setFilter('brandId', event.target.value)}>
            {brands?.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Orden</label>
          <Select
            placeholder="Nombre (asc)"
            value={list.sortField ? `${list.sortField}:${list.sortDirection}` : ''}
            onChange={(event) => {
              const [field, direction] = event.target.value.split(':');
              list.setFilters({ sortField: field ?? '', sortDirection: direction ?? 'asc' });
            }}
          >
            <option value="name:asc">Nombre (A-Z)</option>
            <option value="name:desc">Nombre (Z-A)</option>
            <option value="startYear:desc">Año más reciente</option>
            <option value="vehicleCount:desc">Más vehículos</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Registros</label>
          <p className="text-xs text-slate-400">
            {(activeTab === 'models' ? modelQuery.data?.total : generationQuery.data?.total) ?? 0} resultados
          </p>
        </div>
      </FilterPanel>

      <Tabs
        value={activeTab}
        onChange={setTab}
        items={[
          {
            id: 'models',
            label: 'Modelos',
            count: modelQuery.data?.total,
            content: isError ? (
              <ErrorState onRetry={() => void modelQuery.refetch()} />
            ) : (
              <DataTable<ModelDetail>
                columns={modelColumns}
                rows={modelQuery.data?.items ?? []}
                rowKey={(model) => model.id}
                loading={isLoading}
                sortField={list.sortField}
                sortDirection={list.sortDirection}
                onSort={list.toggleSort}
                empty={
                  list.hasFilters ? (
                    <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
                  ) : (
                    <EmptyState
                      title="Aún no hay modelos"
                      description="Crea tu primer modelo para empezar a estructurar el catálogo."
                      action={<Button onClick={() => setModelModal({ open: true, model: null })}>Nuevo modelo</Button>}
                    />
                  )
                }
                pagination={{
                  page: modelQuery.data?.page ?? 1,
                  pageSize: modelQuery.data?.pageSize ?? list.pageSize,
                  total: modelQuery.data?.total ?? 0,
                  totalPages: modelQuery.data?.totalPages ?? 1,
                  onPageChange: list.setPage,
                  onPageSizeChange: list.setPageSize,
                }}
              />
            ),
          },
          {
            id: 'generations',
            label: 'Generaciones',
            count: generationQuery.data?.total,
            content: isError ? (
              <ErrorState onRetry={() => void generationQuery.refetch()} />
            ) : (
              <DataTable<GenerationDetail>
                columns={generationColumns}
                rows={generationQuery.data?.items ?? []}
                rowKey={(generation) => generation.id}
                loading={isLoading}
                sortField={list.sortField}
                sortDirection={list.sortDirection}
                onSort={list.toggleSort}
                empty={
                  list.hasFilters ? (
                    <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
                  ) : (
                    <EmptyState
                      title="Aún no hay generaciones"
                      description="Las generaciones agrupan los vehículos por años de fabricación."
                      action={
                        <Button onClick={() => setGenerationModal({ open: true, generation: null })}>
                          Nueva generación
                        </Button>
                      }
                    />
                  )
                }
                pagination={{
                  page: generationQuery.data?.page ?? 1,
                  pageSize: generationQuery.data?.pageSize ?? list.pageSize,
                  total: generationQuery.data?.total ?? 0,
                  totalPages: generationQuery.data?.totalPages ?? 1,
                  onPageChange: list.setPage,
                  onPageSizeChange: list.setPageSize,
                }}
              />
            ),
          },
        ]}
      />

      <ModelModal
        open={modelModal.open}
        model={modelModal.model}
        brands={brands ?? []}
        saving={modelMutations.create.isPending || modelMutations.update.isPending}
        onClose={() => setModelModal({ open: false, model: null })}
        onSubmit={handleModelSubmit}
      />

      <GenerationModal
        open={generationModal.open}
        generation={generationModal.generation}
        models={modelsWithBrand.length > 0 ? modelsWithBrand : modelOptions}
        saving={generationMutations.create.isPending || generationMutations.update.isPending}
        onClose={() => setGenerationModal({ open: false, generation: null })}
        onSubmit={handleGenerationSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting?.type === 'model' ? '¿Eliminar modelo?' : '¿Eliminar generación?'}
        message={
          deleting?.type === 'model'
            ? `Se eliminará el modelo “${deleting?.item.name}”. Debe estar sin generaciones ni vehículos asociados.`
            : `Se eliminará la generación “${deleting?.item.name}”. Debe estar sin vehículos asociados.`
        }
        loading={modelMutations.remove.isPending || generationMutations.remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
