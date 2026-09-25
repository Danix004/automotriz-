import { useState } from 'react';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { CategoryModal } from '@/features/categories/CategoryModal';
import { useCategories, useCategoryMutations } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import { toast } from '@/store/toastStore';
import type { Category } from '@/types';
import type { CategoryFormValues } from '@/schemas';

export function CategoriesPage() {
  const list = useListState({ defaults: { q: '' } });
  const { data, isLoading, isError, refetch } = useCategories({
    ...list.queryParams,
    search: list.debouncedSearch || undefined,
  });
  const mutations = useCategoryMutations();

  const [modal, setModal] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [deleting, setDeleting] = useState<Category | null>(null);

  const handleSubmit = (values: CategoryFormValues, id?: string) => {
    if (id) {
      mutations.update.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            toast.success('Categoría actualizada', values.name);
            setModal({ open: false, category: null });
          },
          onError: (error) => toast.error('No se pudo actualizar', getErrorMessage(error)),
        },
      );
    } else {
      mutations.create.mutate(values, {
        onSuccess: () => {
          toast.success('Categoría creada', `${values.name} está disponible para productos.`);
          setModal({ open: false, category: null });
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    mutations.remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Categoría eliminada', deleting.name);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setDeleting(null);
      },
    });
  };

  const columns: Array<Column<Category>> = [
    {
      key: 'name',
      header: 'Categoría',
      sortable: true,
      accessor: (category) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-white">{category.name}</p>
            <p className="truncate text-xs text-slate-500">{category.description || 'Sin descripción'}</p>
          </div>
        </div>
      ),
    },
    { key: 'createdAt', header: 'Creada', sortable: true, hideOn: 'md', accessor: (category) => formatDate(category.createdAt) },
    { key: 'active', header: 'Estado', sortable: true, accessor: (category) => <StatusBadge active={category.active} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (category) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Editar categoría"
            onClick={() => setModal({ open: true, category })}
            className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Eliminar categoría"
            onClick={() => setDeleting(category)}
            className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categorías"
        description={`${data?.total ?? 0} categorías de equipamiento`}
        breadcrumbs={[{ label: 'Equipamientos' }, { label: 'Categorías' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, category: null })}>
            Nueva categoría
          </Button>
        }
      />

      <SearchInput value={list.search} onValueChange={list.setSearch} placeholder="Buscar categoría…" className="sm:max-w-sm" />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <DataTable<Category>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(category) => category.id}
          loading={isLoading}
          sortField={list.sortField}
          sortDirection={list.sortDirection}
          onSort={list.toggleSort}
          empty={
            list.hasFilters ? (
              <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
            ) : (
              <EmptyState
                title="Aún no hay categorías"
                description="Crea categorías para organizar tus equipamientos."
                action={<Button onClick={() => setModal({ open: true, category: null })}>Nueva categoría</Button>}
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

      <CategoryModal
        open={modal.open}
        category={modal.category}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => setModal({ open: false, category: null })}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar categoría?"
        message={`Se eliminará “${deleting?.name}”. Solo es posible si no tiene productos asociados.`}
        loading={mutations.remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
