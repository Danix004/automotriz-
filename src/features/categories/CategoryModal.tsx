import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormValues } from '@/schemas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Textarea } from '@/components/ui/Input';
import type { Category } from '@/types';

export interface CategoryModalProps {
  open: boolean;
  category?: Category | null;
  onClose: () => void;
  onSubmit: (values: CategoryFormValues, id?: string) => void;
  saving?: boolean;
}

/** Alta/edición de categorías de equipamiento. */
export function CategoryModal({ open, category, onClose, onSubmit, saving }: CategoryModalProps) {
  const isEditing = Boolean(category);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: category?.name ?? '',
      description: category?.description ?? '',
      active: category?.active ?? true,
    });
  }, [open, category, reset]);

  const submit: SubmitHandler<CategoryFormValues> = (values) => onSubmit(values, category?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar categoría' : 'Nueva categoría'}
      description="Las categorías organizan el catálogo de equipamientos"
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" form="category-form" loading={saving || isSubmitting}>
            {isEditing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Nombre" htmlFor="category-name" required error={errors.name?.message}>
          <Input id="category-name" placeholder="Ej. Multimedia" {...register('name')} error={errors.name?.message} />
        </Field>

        <Field label="Descripción" htmlFor="category-description" error={errors.description?.message}>
          <Textarea
            id="category-description"
            placeholder="Describe qué tipo de productos agrupa esta categoría"
            {...register('description')}
            error={errors.description?.message}
          />
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Categoría activa</p>
            <p className="text-xs text-slate-500">Disponible para asignar a productos</p>
          </div>
          <Switch checked={watch('active')} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
        </div>
      </form>
    </Modal>
  );
}
