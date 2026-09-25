import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userSchema, type UserFormValues } from '@/schemas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import type { AppUser } from '@/types';

export interface UserModalProps {
  open: boolean;
  user?: AppUser | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: UserFormValues, id?: string) => void;
}

const ROLES: AppUser['role'][] = ['Administrador', 'Editor', 'Visualizador'];

/** Alta/edición de usuarios del panel administrativo. */
export function UserModal({ open, user, saving, onClose, onSubmit }: UserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', role: 'Editor', active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'Editor',
      active: user?.active ?? true,
    });
  }, [open, user, reset]);

  const submit: SubmitHandler<UserFormValues> = (values) => onSubmit(values, user?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Editar usuario' : 'Nuevo usuario'}
      description="Los usuarios administran el catálogo con permisos según su rol"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="user-form" loading={saving || isSubmitting}>
            {user ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Nombre completo" htmlFor="user-name" required error={errors.name?.message}>
          <Input id="user-name" placeholder="Ej. Ana Torres" {...register('name')} error={errors.name?.message} />
        </Field>

        <Field label="Correo" htmlFor="user-email" required error={errors.email?.message}>
          <Input
            id="user-email"
            type="email"
            placeholder="ana@empresa.com"
            {...register('email')}
            error={errors.email?.message}
          />
        </Field>

        <Field label="Rol" htmlFor="user-role" required error={errors.role?.message}>
          <Select id="user-role" {...register('role')} error={errors.role?.message}>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Usuario activo</p>
            <p className="text-xs text-slate-500">Puede iniciar sesión y editar el catálogo</p>
          </div>
          <Switch checked={watch('active')} onChange={(value) => setValue('active', value, { shouldDirty: true })} />
        </div>
      </form>
    </Modal>
  );
}
