import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generationSchema, modelSchema, type GenerationFormValues, type ModelFormValues } from '@/schemas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { BODY_TYPES } from '@/types/constants';
import type { Generation, VehicleModel } from '@/types';
import type { GenerationDetail, ModelDetail } from '@/types/dto';

/* ------------------------------- Modelos ------------------------------- */

export interface ModelModalProps {
  open: boolean;
  model?: ModelDetail | null;
  brands: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (values: ModelFormValues, id?: string) => void;
  saving?: boolean;
}

export function ModelModal({ open, model, brands, onClose, onSubmit, saving }: ModelModalProps) {
  const isEditing = Boolean(model);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ModelFormValues>({
    resolver: zodResolver(modelSchema),
    defaultValues: { brandId: '', name: '', bodyType: 'Sedán', active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      brandId: model?.brandId ?? brands[0]?.id ?? '',
      name: model?.name ?? '',
      bodyType: model?.bodyType ?? 'Sedán',
      active: model?.active ?? true,
    });
  }, [open, model, brands, reset]);

  const active = watch('active');
  const submit: SubmitHandler<ModelFormValues> = (values) => onSubmit(values, model?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar modelo' : 'Nuevo modelo'}
      description="Un modelo pertenece a una marca y agrupa varias generaciones"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="model-form" loading={saving || isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear modelo'}
          </Button>
        </>
      }
    >
      <form id="model-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Marca" htmlFor="model-brand" required error={errors.brandId?.message}>
          <Select id="model-brand" placeholder="Seleccionar marca" {...register('brandId')} error={errors.brandId?.message}>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Modelo" htmlFor="model-name" required error={errors.name?.message}>
            <Input id="model-name" placeholder="Ej. Hilux" {...register('name')} error={errors.name?.message} />
          </Field>

          <Field label="Carrocería" htmlFor="model-body" error={errors.bodyType?.message}>
            <Select id="model-body" {...register('bodyType')} error={errors.bodyType?.message}>
              {BODY_TYPES.map((body) => (
                <option key={body} value={body}>
                  {body}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Modelo activo</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Los modelos inactivos se ocultan en los selectores</p>
          </div>
          <Switch checked={active} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
        </div>
      </form>
    </Modal>
  );
}

/* ---------------------------- Generaciones ---------------------------- */

export interface GenerationModalProps {
  open: boolean;
  generation?: GenerationDetail | null;
  models: Array<{ id: string; name: string; brandName?: string }>;
  defaultModelId?: string;
  onClose: () => void;
  onSubmit: (values: GenerationFormValues, id?: string) => void;
  saving?: boolean;
}

export function GenerationModal({
  open,
  generation,
  models,
  defaultModelId,
  onClose,
  onSubmit,
  saving,
}: GenerationModalProps) {
  const isEditing = Boolean(generation);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GenerationFormValues>({
    resolver: zodResolver(generationSchema),
    defaultValues: { modelId: defaultModelId ?? '', name: '', startYear: 2020, endYear: null },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      modelId: generation?.modelId ?? defaultModelId ?? models[0]?.id ?? '',
      name: generation?.name ?? '',
      startYear: generation?.startYear ?? 2020,
      endYear: generation?.endYear ?? null,
    });
  }, [open, generation, defaultModelId, models, reset]);

  const submit: SubmitHandler<GenerationFormValues> = (values) => onSubmit(values, generation?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar generación' : 'Nueva generación'}
      description="Agrupa los vehículos por años de fabricación y versión"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="generation-form" loading={saving || isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear generación'}
          </Button>
        </>
      }
    >
      <form id="generation-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Modelo" htmlFor="generation-model" required error={errors.modelId?.message}>
          <Select
            id="generation-model"
            placeholder="Seleccionar modelo"
            disabled={Boolean(defaultModelId)}
            {...register('modelId')}
            error={errors.modelId?.message}
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.brandName ? `${model.brandName} · ` : ''}
                {model.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Nombre" htmlFor="generation-name" required error={errors.name?.message} hint="Ej. 8ª generación">
            <Input id="generation-name" placeholder="8ª generación" {...register('name')} error={errors.name?.message} />
          </Field>

          <Field label="Año inicial" htmlFor="generation-start" required error={errors.startYear?.message}>
            <Input id="generation-start" type="number" min={1950} max={2100} {...register('startYear')} error={errors.startYear?.message} />
          </Field>

          <Field label="Año final (opcional)" htmlFor="generation-end" error={errors.endYear?.message} hint="Vacío = sigue en producción">
            <Input id="generation-end" type="number" min={1950} max={2100} {...register('endYear')} error={errors.endYear?.message} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export type { Generation, VehicleModel };
