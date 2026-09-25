import { useState } from 'react';
import { Plus, Trash2, UserPen, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, NoResults } from '@/components/ui/States';
import { UserModal } from '@/features/users/UserModal';
import { useUsers, useUserMutations } from '@/hooks/queries';
import { useListState } from '@/hooks/useListState';
import { getErrorMessage } from '@/utils/errors';
import { formatDate } from '@/utils/format';
import { toast } from '@/store/toastStore';
import type { AppUser } from '@/types';
import type { UserFormValues } from '@/schemas';

const ROLE_VARIANT: Record<AppUser['role'], 'primary' | 'info' | 'neutral'> = {
  Administrador: 'primary',
  Editor: 'info',
  Visualizador: 'neutral',
};

export function UsersPage() {
  const list = useListState({ defaults: { q: '' } });
  const { data, isLoading, isError, refetch } = useUsers({
    ...list.queryParams,
    search: list.debouncedSearch || undefined,
  });
  const mutations = useUserMutations();

  const [modal, setModal] = useState<{ open: boolean; user: AppUser | null }>({ open: false, user: null });
  const [deleting, setDeleting] = useState<AppUser | null>(null);

  const handleSubmit = (values: UserFormValues, id?: string) => {
    if (id) {
      mutations.update.mutate(
        { id, data: values },
        {
          onSuccess: () => {
            toast.success('Usuario actualizado', values.name);
            setModal({ open: false, user: null });
          },
          onError: (error) => toast.error('No se pudo actualizar', getErrorMessage(error)),
        },
      );
    } else {
      mutations.create.mutate(values, {
        onSuccess: () => {
          toast.success('Usuario creado', `${values.name} ya puede acceder al sistema.`);
          setModal({ open: false, user: null });
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    mutations.remove.mutate(deleting.id, {
      onSuccess: () => {
        toast.success('Usuario eliminado', deleting.name);
        setDeleting(null);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setDeleting(null);
      },
    });
  };

  const columns: Array<Column<AppUser>> = [
    {
      key: 'name',
      header: 'Usuario',
      sortable: true,
      accessor: (user) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-white">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      accessor: (user) => <Badge variant={ROLE_VARIANT[user.role]}>{user.role}</Badge>,
    },
    { key: 'createdAt', header: 'Alta', sortable: true, hideOn: 'md', accessor: (user) => formatDate(user.createdAt) },
    { key: 'active', header: 'Estado', sortable: true, accessor: (user) => <StatusBadge active={user.active} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      accessor: (user) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label="Editar usuario"
            onClick={() => setModal({ open: true, user })}
            className="rounded-lg p-2 text-slate-400 hover:bg-primary/10 hover:text-primary"
          >
            <UserPen className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Eliminar usuario"
            onClick={() => setDeleting(user)}
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
        title="Usuarios"
        description={`${data?.total ?? 0} usuarios con acceso al panel`}
        breadcrumbs={[{ label: 'Administración' }, { label: 'Usuarios' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, user: null })}>
            Nuevo usuario
          </Button>
        }
      />

      <SearchInput
        value={list.search}
        onValueChange={list.setSearch}
        placeholder="Buscar por nombre o correo…"
        className="sm:max-w-sm"
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <DataTable<AppUser>
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(user) => user.id}
          loading={isLoading}
          sortField={list.sortField}
          sortDirection={list.sortDirection}
          onSort={list.toggleSort}
          empty={
            list.hasFilters ? (
              <NoResults term={list.debouncedSearch} onClear={() => list.clearFilters()} />
            ) : (
              <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="Aún no hay usuarios"
                description="Crea usuarios para que tu equipo trabaje sobre el catálogo."
                action={<Button onClick={() => setModal({ open: true, user: null })}>Nuevo usuario</Button>}
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

      <UserModal
        open={modal.open}
        user={modal.user}
        saving={mutations.create.isPending || mutations.update.isPending}
        onClose={() => setModal({ open: false, user: null })}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="¿Eliminar usuario?"
        message={`Se eliminará “${deleting?.name}” y perderá el acceso al panel.`}
        loading={mutations.remove.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
