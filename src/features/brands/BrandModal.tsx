import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { brandSchema, type BrandFormValues } from '@/schemas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import type { Brand } from '@/types';

export interface BrandModalProps {
  open: boolean;
  brand?: Brand | null;
  onClose: () => void;
  onSubmit: (values: BrandFormValues, id?: string) => void;
  saving?: boolean;
}

const COUNTRIES = [
  'Japón',
  'Estados Unidos',
  'Alemania',
  'Corea del Sur',
  'Francia',
  'Italia',
  'Suecia',
  'Reino Unido',
  'China',
  'España',
  'Brasil',
  'México',
];

/** Modal de alta/edición de marcas. */
export function BrandModal({ open, brand, onClose, onSubmit, saving }: BrandModalProps) {
  const isEditing = Boolean(brand);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { name: '', country: '', logo: '', active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: brand?.name ?? '',
      country: brand?.country ?? '',
      logo: brand?.logo ?? '',
      active: brand?.active ?? true,
    });
  }, [open, brand, reset]);

  const active = watch('active');

  const submit: SubmitHandler<BrandFormValues> = (values) => onSubmit(values, brand?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar marca' : 'Nueva marca'}
      description={isEditing ? `Actualiza los datos de ${brand?.name}` : 'Agrega una marca al catálogo de vehículos'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="brand-form" loading={saving || isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear marca'}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Nombre" htmlFor="brand-name" required error={errors.name?.message}>
          <Input id="brand-name" placeholder="Ej. Toyota" {...register('name')} error={errors.name?.message} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="País de origen" htmlFor="brand-country" required error={errors.country?.message}>
            <Select
              id="brand-country"
              placeholder="Seleccionar país"
              {...register('country')}
              error={errors.country?.message}
            >
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="URL del logo (opcional)" htmlFor="brand-logo" hint="Se usa una imagen generada si está vacío">
            <Input id="brand-logo" placeholder="https://…" {...register('logo')} />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Marca activa</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Las marcas inactivas no aparecen en los selectores</p>
          </div>
          <Switch checked={active} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
        </div>
      </form>
    </Modal>
  );
}
