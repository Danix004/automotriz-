import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Link2,
  Pencil,
  Settings2,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Tabs } from '@/components/ui/Feedback';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { VehicleSpecGrid } from '@/components/shared/VehicleCard';
import { ProductCard } from '@/components/shared/ProductCard';
import { useVehicle, useVehicleMutations } from '@/hooks/queries';
import { groupBy } from '@/utils/array';
import { getErrorMessage } from '@/utils/errors';
import { formatDate, formatNumber } from '@/utils/format';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading, isError, refetch } = useVehicle(id);
  const mutations = useVehicleMutations();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const grouped = useMemo(
    () => groupBy(vehicle?.compatibility ?? [], (entry) => entry.product?.category?.name || 'Otros'),
    [vehicle],
  );
  const categoryNames = useMemo(() => Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'es')), [grouped]);

  if (isLoading) return <LoadingState label="Cargando ficha del vehículo…" />;
  if (isError || !vehicle) {
    return <ErrorState title="Vehículo no encontrado" message="El registro puede haber sido eliminado." onRetry={() => void refetch()} />;
  }

  const title = `${vehicle.brand?.name} ${vehicle.model?.name}`;

  const handleDelete = () => {
    mutations.remove.mutate(vehicle.id, {
      onSuccess: () => {
        toast.success('Vehículo eliminado', `${title} ${vehicle.year} fue eliminado.`);
        navigate(paths.vehicles);
      },
      onError: (error) => {
        toast.error('No se pudo eliminar', getErrorMessage(error));
        setConfirmDelete(false);
      },
    });
  };

  const productsByCategory = categoryNames.map((name) => ({
    name,
    items: grouped[name].map((entry) => entry.product),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <Link
              to={paths.vehicles}
              aria-label="Volver al catálogo"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {title} {vehicle.year}
          </span>
        }
        description={`${vehicle.generation?.name} · ${vehicle.version} · registrado el ${formatDate(vehicle.createdAt)}`}
        breadcrumbs={[
          { label: 'Catálogo', to: paths.vehicles },
          { label: 'Vehículos', to: paths.vehicles },
          { label: `${title} ${vehicle.year}` },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              icon={<Link2 className="h-4 w-4" />}
              onClick={() => navigate(`${paths.compatibility}?vehicleId=${vehicle.id}`)}
            >
              Ver compatibilidades
            </Button>
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(paths.vehicleEdit(vehicle.id))}>
              Editar
            </Button>
            <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Eliminar
            </Button>
          </>
        }
      />

      {/* Ficha */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardBody className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{vehicle.generation?.name}</Badge>
              <Badge variant="info">{vehicle.bodyType}</Badge>
              <StatusBadge active={vehicle.active} />
            </div>
            <dl className="space-y-2 text-sm">
              <SpecRow label="Marca" value={vehicle.brand?.name ?? '—'} />
              <SpecRow label="Modelo" value={vehicle.model?.name ?? '—'} />
              <SpecRow label="Generación" value={vehicle.generation?.name ?? '—'} />
              <SpecRow label="Año" value={String(vehicle.year)} />
              <SpecRow label="Versión" value={vehicle.version} />
              <SpecRow label="Cilindrada" value={`${vehicle.displacement} cc`} />
            </dl>
          </CardBody>
        </Card>

        <div className="space-y-4 xl:col-span-3">
          <Card>
            <CardHeader title="Especificaciones técnicas" description="Datos del vehículo seleccionado" />
            <CardBody>
              <VehicleSpecGrid vehicle={vehicle} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Otras versiones del mismo año"
              description="Vehículos de la misma generación y año"
            />
            <CardBody className="flex flex-wrap gap-2">
              {vehicle.siblingVersions.length === 0 && (
                <p className="text-sm text-slate-500">No hay otras versiones registradas para este año.</p>
              )}
              {vehicle.siblingVersions.map((sibling) => (
                <Link
                  key={sibling.id}
                  to={paths.vehicle(sibling.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
                >
                  <Settings2 className="h-4 w-4" />
                  {sibling.version} · {sibling.engine}
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Equipamiento compatible */}
      <Card>
        <CardHeader
          title={`Equipamiento compatible (${formatNumber(vehicle.compatibility.length)})`}
          description="Productos organizados por categoría de equipamiento"
          actions={
            <Button
              size="sm"
              variant="outline"
              icon={<Link2 className="h-4 w-4" />}
              onClick={() => navigate(`${paths.compatibility}?vehicleId=${vehicle.id}`)}
            >
              Agregar compatibilidad
            </Button>
          }
        />
        <CardBody>
          {productsByCategory.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-7 w-7" />}
              title="Sin equipamiento compatible"
              description="Asocia productos a este vehículo desde el módulo de compatibilidades."
              action={
                <Button onClick={() => navigate(`${paths.compatibility}?vehicleId=${vehicle.id}`)}>
                  Agregar compatibilidad
                </Button>
              }
            />
          ) : (
            <Tabs
              items={productsByCategory.map((group) => ({
                id: group.name,
                label: group.name,
                count: group.items.length,
                content: (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {group.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ),
              }))}
            />
          )}
        </CardBody>
      </Card>

      {/* Recomendados */}
      {vehicle.recommended.length > 0 && (
        <Card>
          <CardHeader
            title="Accesorios recomendados"
            description="Productos populares que aún no están asociados a este vehículo"
            actions={
              <Button size="sm" variant="ghost" onClick={() => navigate(paths.products)}>
                Ver catálogo completo
              </Button>
            }
          />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {vehicle.recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </CardBody>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="¿Eliminar vehículo?"
        message={`Se eliminará ${title} ${vehicle.year} ${vehicle.version} y sus compatibilidades asociadas.`}
        loading={mutations.remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}
