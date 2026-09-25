import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Car, CarFront, Layers, Pencil, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { ErrorState, LoadingState, EmptyState } from '@/components/ui/States';
import { SmartImage } from '@/components/shared/SmartImage';
import { ModelModal } from '@/features/models/ModelModals';
import { useBrand, useBrandMutations, useModelMutations, useBrandsOptions } from '@/hooks/queries';
import { getErrorMessage } from '@/utils/errors';
import { logoPlaceholder } from '@/utils/placeholder';
import { formatDate } from '@/utils/format';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';
import type { ModelFormValues } from '@/schemas';

export function BrandDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: brand, isLoading, isError, refetch } = useBrand(id);
  const { data: allBrands } = useBrandsOptions();
  const brandMutations = useBrandMutations();
  const modelMutations = useModelMutations();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return <LoadingState label="Cargando marca…" />;
  if (isError || !brand) return <ErrorState title="Marca no encontrada" onRetry={() => void refetch()} />;

  const handleModelSubmit = (values: ModelFormValues) => {
    modelMutations.create.mutate(values, {
      onSuccess: () => {
        toast.success('Modelo creado', `${values.name} se agregó a ${brand.name}.`);
        setModalOpen(false);
        void refetch();
      },
      onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
    });
  };

  const toggleActive = () => {
    brandMutations.update.mutate(
      { id: brand.id, data: { active: !brand.active } },
      {
        onSuccess: () => toast.success(brand.active ? 'Marca desactivada' : 'Marca activada', brand.name),
        onError: (error) => toast.error('Error', getErrorMessage(error)),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <Link
              to={paths.brands}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              aria-label="Volver a marcas"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {brand.name}
          </span>
        }
        description={`${brand.country} · creada el ${formatDate(brand.createdAt)}`}
        breadcrumbs={[{ label: 'Catálogo', to: paths.brands }, { label: 'Marcas', to: paths.brands }, { label: brand.name }]}
        actions={
          <>
            <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate(`${paths.brands}`)}>
              Editar en lista
            </Button>
            <Button variant={brand.active ? 'outline' : 'success'} onClick={toggleActive} loading={brandMutations.update.isPending}>
              {brand.active ? 'Desactivar' : 'Activar'}
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              Nuevo modelo
            </Button>
          </>
        }
      />

      {/* Hero */}
      <Card>
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            <SmartImage src={brand.logo} alt={brand.name} fallback={() => logoPlaceholder(brand.name)} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{brand.country}</Badge>
              <StatusBadge active={brand.active} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {brand.name} cuenta con <strong>{brand.modelCount}</strong> modelos y{' '}
              <strong>{brand.vehicleCount}</strong> vehículos registrados. Cada modelo agrupa una o varias generaciones
              con sus años, motores y versiones.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <HeroStat icon={Boxes} label="Modelos" value={brand.modelCount} />
            <HeroStat icon={Layers} label="Vehículos" value={brand.vehicleCount} />
            <HeroStat icon={Car} label="Activos" value={brand.active ? 1 : 0} />
          </div>
        </CardBody>
      </Card>

      {/* Modelos */}
      <Card>
        <CardHeader
          title="Modelos de la marca"
          description="Modelos, carrocería y número de vehículos por modelo"
          actions={
            <Button size="sm" variant="outline" icon={<CarFront className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
              Agregar modelo
            </Button>
          }
        />
        {brand.models.length === 0 ? (
          <EmptyState
            title="Esta marca aún no tiene modelos"
            description="Crea modelos para después asociarles generaciones y vehículos."
            action={<Button onClick={() => setModalOpen(true)}>Nuevo modelo</Button>}
          />
        ) : (
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brand.models.map((model) => (
              <Link
                key={model.id}
                to={`${paths.vehicles}?modelId=${model.id}`}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary">
                      {model.name}
                    </p>
                    <p className="text-xs text-slate-500">{model.bodyType}</p>
                  </div>
                  <StatusBadge active={model.active} />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" /> {model.bodyType}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    <Car className="h-3.5 w-3.5" /> ver vehículos
                  </span>
                </div>
              </Link>
            ))}
          </CardBody>
        )}
      </Card>

      <ModelModal
        open={modalOpen}
        model={null}
        brands={(allBrands ?? []).map((item) => ({ id: item.id, name: item.name }))}
        saving={modelMutations.create.isPending}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModelSubmit}
      />
    </div>
  );
}

function HeroStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
