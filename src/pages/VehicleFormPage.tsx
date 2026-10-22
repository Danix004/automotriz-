import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { vehicleSchema, type VehicleFormValues } from '@/schemas';
import { useBrandsOptions, useGenerationsByModel, useModelsByBrand, useVehicle, useVehicleMutations } from '@/hooks/queries';
import { BODY_TYPES, DRIVETRAIN_TYPES, FUEL_TYPES, TRANSMISSION_TYPES } from '@/types/constants';
import { getErrorMessage } from '@/utils/errors';
import { toast } from '@/store/toastStore';
import { paths } from '@/routes/paths';

export function VehicleFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = mode === 'edit';

  const { data: vehicle, isLoading } = useVehicle(isEdit ? id : undefined);
  const { data: brands } = useBrandsOptions();
  const mutations = useVehicleMutations();

  const [brandId, setBrandId] = useState('');
  const [modelId, setModelId] = useState('');

  const { data: models } = useModelsByBrand(brandId || undefined);
  const { data: generations } = useGenerationsByModel(modelId || undefined);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      generationId: '',
      year: new Date().getFullYear(),
      version: '',
      engine: '',
      fuel: 'Gasolina',
      transmission: 'Manual',
      drivetrain: 'FWD',
      bodyType: 'Sedán',
      power: 150,
      displacement: 1600,
      image: '',
      active: true,
    },
  });

  useEffect(() => {
    if (!isEdit || !vehicle) return;
    setBrandId(vehicle.brand?.id ?? '');
    setModelId(vehicle.model?.id ?? '');
    reset({
      generationId: vehicle.generationId,
      year: vehicle.year,
      version: vehicle.version,
      engine: vehicle.engine,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      drivetrain: vehicle.drivetrain,
      bodyType: vehicle.bodyType,
      power: vehicle.power,
      displacement: vehicle.displacement,
      image: vehicle.image,
      active: vehicle.active,
    });
  }, [isEdit, vehicle, reset]);

  const previewTitle = useMemo(() => {
    const brand = brands?.find((item) => item.id === brandId);
    const model = models?.items.find((item) => item.id === modelId);
    return `${brand?.name ?? 'Vehículo'} ${model?.name ?? ''}`.trim();
  }, [brands, models, brandId, modelId]);

  const onSubmit: SubmitHandler<VehicleFormValues> = (values) => {
    const payload = { ...values, year: Number(values.year), power: Number(values.power), displacement: Number(values.displacement) };
    if (isEdit && id) {
      mutations.update.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            toast.success('Vehículo actualizado', `${previewTitle} ${payload.year} se guardó.`);
            navigate(paths.vehicle(id));
          },
          onError: (error) => toast.error('No se pudo guardar', getErrorMessage(error)),
        },
      );
    } else {
      mutations.create.mutate(payload, {
        onSuccess: (created) => {
          toast.success('Vehículo creado', `${previewTitle} ${payload.year} se agregó al catálogo.`);
          navigate(paths.vehicle(created.id));
        },
        onError: (error) => toast.error('No se pudo crear', getErrorMessage(error)),
      });
    }
  };

  if (isEdit && isLoading) return <LoadingState label="Cargando vehículo…" />;
  if (isEdit && !vehicle) return <ErrorState title="Vehículo no encontrado" />;

  return (
    <div className="space-y-5">
      <PageHeader
        title={isEdit ? 'Editar vehículo' : 'Nuevo vehículo'}
        description={
          isEdit
            ? 'Actualiza las especificaciones técnicas del vehículo'
            : 'Registra un vehículo asociándolo a una marca, modelo y generación'
        }
        breadcrumbs={[
          { label: 'Catálogo', to: paths.vehicles },
          { label: 'Vehículos', to: paths.vehicles },
          { label: isEdit ? 'Editar' : 'Nuevo' },
        ]}
        actions={
          <>
            <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button
              form="vehicle-form"
              type="submit"
              icon={<Save className="h-4 w-4" />}
              loading={mutations.create.isPending || mutations.update.isPending || isSubmitting}
            >
              {isEdit ? 'Guardar cambios' : 'Crear vehículo'}
            </Button>
          </>
        }
      />

      <form id="vehicle-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Clasificación */}
        <Card className="xl:col-span-2">
          <CardHeader title="Clasificación" description="Marca → modelo → generación" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Marca" htmlFor="vehicle-brand" required>
                <Select
                  id="vehicle-brand"
                  placeholder="Seleccionar marca"
                  value={brandId}
                  onChange={(event) => {
                    setBrandId(event.target.value);
                    setModelId('');
                    setValue('generationId', '', { shouldValidate: true });
                  }}
                >
                  {brands?.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Modelo" htmlFor="vehicle-model" required>
                <Select
                  id="vehicle-model"
                  placeholder={brandId ? 'Seleccionar modelo' : 'Elige una marca'}
                  value={modelId}
                  disabled={!brandId}
                  onChange={(event) => {
                    setModelId(event.target.value);
                    setValue('generationId', '', { shouldValidate: true });
                  }}
                >
                  {models?.items.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Generación"
                htmlFor="vehicle-generation"
                required
                error={errors.generationId?.message}
              >
                <Select
                  id="vehicle-generation"
                  placeholder={modelId ? 'Seleccionar generación' : 'Elige un modelo'}
                  disabled={!modelId}
                  {...register('generationId')}
                  error={errors.generationId?.message}
                >
                  {generations?.map((generation) => (
                    <option key={generation.id} value={generation.id}>
                      {generation.name} ({generation.startYear}–{generation.endYear ?? 'actual'})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Año" htmlFor="vehicle-year" required error={errors.year?.message}>
                <Input id="vehicle-year" type="number" min={1950} max={2100} {...register('year')} error={errors.year?.message} />
              </Field>
              <Field label="Versión" htmlFor="vehicle-version" required error={errors.version?.message}>
                <Input id="vehicle-version" placeholder="Ej. SRX" {...register('version')} error={errors.version?.message} />
              </Field>
              <Field label="Motor" htmlFor="vehicle-engine" required error={errors.engine?.message}>
                <Input id="vehicle-engine" placeholder="Ej. 2.8 Turbo Diésel" {...register('engine')} error={errors.engine?.message} />
              </Field>
            </div>
          </CardBody>

          <CardHeader title="Especificaciones técnicas" description="Datos mecánicos y de desempeño" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Combustible" htmlFor="vehicle-fuel">
              <Select id="vehicle-fuel" {...register('fuel')}>
                {FUEL_TYPES.map((fuel) => (
                  <option key={fuel} value={fuel}>
                    {fuel}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Transmisión" htmlFor="vehicle-transmission">
              <Select id="vehicle-transmission" {...register('transmission')}>
                {TRANSMISSION_TYPES.map((transmission) => (
                  <option key={transmission} value={transmission}>
                    {transmission}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tracción" htmlFor="vehicle-drivetrain">
              <Select id="vehicle-drivetrain" {...register('drivetrain')}>
                {DRIVETRAIN_TYPES.map((drivetrain) => (
                  <option key={drivetrain} value={drivetrain}>
                    {drivetrain}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Carrocería" htmlFor="vehicle-body">
              <Select id="vehicle-body" {...register('bodyType')}>
                {BODY_TYPES.map((body) => (
                  <option key={body} value={body}>
                    {body}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Potencia (hp)" htmlFor="vehicle-power" required error={errors.power?.message}>
              <Input id="vehicle-power" type="number" min={1} max={3000} {...register('power')} error={errors.power?.message} />
            </Field>
            <Field label="Cilindrada (cc)" htmlFor="vehicle-displacement" error={errors.displacement?.message}>
              <Input id="vehicle-displacement" type="number" min={0} {...register('displacement')} error={errors.displacement?.message} />
            </Field>
          </CardBody>
        </Card>

        {/* Resumen */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Estado" description="Disponibilidad en el catálogo" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Vehículo activo</p>
                  <p className="text-xs text-slate-500">Visible en selectores y buscadores</p>
                </div>
                <Switch checked={watch('active')} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
            </CardBody>
          </Card>
        </div>
      </form>
    </div>
  );
}
