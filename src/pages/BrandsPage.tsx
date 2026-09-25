import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, MoreHorizontal, Pencil, Plus, Power, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { FilterPanel } from '@/components/ui/FilterPanel';
import { Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/Badge';
import { SmartImage } from '@/components/shared/SmartImage';
import { BrandModal } from '@/features/brands/BrandModal';
import { useBrands, useBrandMutations } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import { logoPlaceholder } from '@/utils/placeholder';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';
import type { Brand } from '@/types';
import type { BrandDetail } from '@/types/dto';
import type { BrandFormValues } from '@/schemas';

export function BrandsPage() {
  const navigate = useNavigate();
  const list = useListState({ defaults: { q: '', active: '' } });
  const { data, isLoading, isError, refetch } = useBrands({
    ...list.queryParams,
    search: list.debouncedSearch || undefined,
  });
  const mutations = useBrandMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState<Brand | null>(null);

  const activeFilters = [list.filters.q, list.filters.active].filter(Boolean).length;

  const handleSubmit = (values: BrandFormValues, id?: string) => {
    if (id) {
      mutations.update.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            toast.success('Marca actualizada', `${values.name} se guardó correctamente.`);
            setModalOpen(false);
            setEditing(null);
          },
          onError: (error) => toast.error('No se pudo actualizar', getErrorMessage(error)),
        },
      );
    } else {
      mutations.create.mutate(values, {
        onSuccess: () => {
          toast.success('Marca creada', `${values.name} se agregó al catálogo.`);
          setModalOpen(false);
          void refetch();
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  const toggleActive = (brand: Brand) => {
    mutations.update.mutate(
      { id: brand.id, data: { active: !brand.active } },
      {
        onSuccess: () =>
          toast.success(brand.active ? 'Marca desactivada' : 'Marca activada', brand.name),
        onError: (error) => toast.error('Error', getErrorMessage(error)),
      },
    );
  };

  const confirmDelete = () => {
    if (!deleting) return;
    mutations.remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Marca eliminada', `${deleting.name} fue eliminada.`);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setDeleting(null);
      },
    });
  };

  const columns: Array<Column<BrandDetail>> = [
    {
      key: 'name',
      header: 'Marca',
      sortable: true,
      accessor: (brand) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
            <SmartImage src={brand.logo} alt={brand.name} fallback={() => logoPlaceholder(brand.name)} className="h-full w-full" decorative />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-white">{brand.name}</p>
            <p className="truncate text-xs text-slate-500">{brand.country}</p>
          </div>
        </div>
      ),
    },
    { key: 'country', header: 'País', sortable: true, hideOn: 'md', accessor: (brand) => brand.country },
    { key: 'modelCount', header: 'Modelos', hideOn: 'md', accessor: (brand) => brand.modelCount ?? 0, align: 'center' },
    { key: 'vehicleCount', header: 'Vehículos', hideOn: 'lg', accessor: (brand) => brand.vehicleCount ?? 0, align: 'center' },
    { key: 'createdAt', header: 'Creada', sortable: true, hideOn: 'xl', accessor: (brand) => formatDate(brand.createdAt) },
    { key: 'active', header: 'Estado', sortable: true, accessor: (brand) => <StatusBadge active={brand.active} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (brand) => (
        <div className="flex justify-end gap-1" onClick={(event) => event.stopPropagation()}>
          <Dropdown
            trigger={
              <button
                type="button"
                aria-label={`Acciones de ${brand.name}`}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem icon={<Eye className="h-4 w-4" />} to={paths.brand(brand.id)}>
              Ver detalle
            </DropdownItem>
            <DropdownItem
              icon={<Pencil className="h-4 w-4" />}
              onClick={() => {
                setEditing(brand);
                setModalOpen(true);
              }}
            >
              Editar
            </DropdownItem>
            <DropdownItem icon={<Power className="h-4 w-4" />} onClick={() => toggleActive(brand)}>
              {brand.active ? 'Desactivar' : 'Activar'}
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger icon={<Trash2 className="h-4 w-4" />} onClick={() => setDeleting(brand)}>
              Eliminar
            </DropdownItem>
          </Dropdown>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Marcas"
        description={`${data?.total ?? 0} marcas registradas en el catálogo`}
        breadcrumbs={[{ label: 'Catálogo' }, { label: 'Marcas' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Nueva marca
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={list.search}
          onValueChange={list.setSearch}
          placeholder="Buscar por nombre o país…"
          className="sm:max-w-sm"
        />
        <div className="sm:ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<Eye className="h-4 w-4" />} onClick={() => navigate(paths.models)}>
            Ver modelos
          </Button>
        </div>
      </div>

      <FilterPanel
        activeCount={activeFilters}
        onClear={() => list.clearFilters(['q', 'active'])}
        title="Filtros de marcas"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Estado</label>
          <Select placeholder="Todos" value={list.filters.active} onChange={(event) => list.setFilter('active', event.target.value)}>
            <option value="true">Activas</option>
            <option value="false">Inactivas</option>
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
            <option value="country:asc">País (A-Z)</option>
            <option value="createdAt:desc">Más recientes</option>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Vista</label>
          <p className="text-xs text-slate-400">
            {data?.total ?? 0} resultados · página {list.page}
          </p>
        </div>
      </FilterPanel>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <DataTable<BrandDetail>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(brand) => brand.id}
          loading={isLoading}
          sortField={list.sortField}
          sortDirection={list.sortDirection}
          onSort={list.toggleSort}
          onRowClick={(brand) => navigate(paths.brand(brand.id))}
          empty={list.hasFilters ? <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} /> : <EmptyState title="Aún no hay marcas" />}
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

      <BrandModal
        open={modalOpen}
        brand={editing}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar marca?"
        message={`Se eliminará “${deleting?.name}” del catálogo. Esta acción no se puede deshacer. Los modelos asociados no podrán existir sin marca, por lo que se bloqueará si tiene datos relacionados.`}
        loading={mutations.remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
