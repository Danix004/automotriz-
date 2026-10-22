import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Database, Palette, Plug, RotateCcw, Save } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, Switch } from '@/components/ui/Field';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { settingsSchema, type SettingsFormValues } from '@/schemas';
import { useSettings, useSettingsMutation } from '@/hooks/queries';
import { useUIStore } from '@/store/uiStore';
import { resetDatabase } from '@/services/database';
import { getErrorMessage } from '@/utils/errors';
import { formatCurrency } from '@/utils/format';
import { toast } from '@/store/toastStore';
import { useState } from 'react';

const CURRENCIES = [
  { code: 'USD', label: 'Dólar estadounidense' },
  { code: 'PYG', label: 'Guaraní paraguayo' },
  { code: 'EUR', label: 'Euro' },
  { code: 'MXN', label: 'Peso mexicano' },
  { code: 'ARS', label: 'Peso argentino' },
  { code: 'COP', label: 'Peso colombiano' },
  { code: 'CLP', label: 'Peso chileno' },
  { code: 'PEN', label: 'Sol peruano' },
];
const TIMEZONES = ['America/Bogota', 'America/Asuncion', 'America/Mexico_City', 'America/Argentina/Buenos_Aires', 'America/Santiago', 'America/Lima', 'Europe/Madrid', 'UTC'];

export function SettingsPage() {
  const { data: settings } = useSettings();
  const mutation = useSettingsMutation();
  const { theme, toggleTheme } = useUIStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appName: 'AutoEquip Pro',
      currency: 'USD',
      timezone: 'America/Bogota',
      lowStockThreshold: 5,
      enablePromotions: true,
      defaultPageSize: 10,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        appName: settings.appName,
        currency: settings.currency,
        timezone: settings.timezone,
        lowStockThreshold: settings.lowStockThreshold,
        enablePromotions: settings.enablePromotions,
        defaultPageSize: settings.defaultPageSize,
      });
    }
  }, [settings, reset]);

  const onSubmit: SubmitHandler<SettingsFormValues> = (values) => {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Configuración guardada', 'Los cambios se aplicaron al catálogo.'),
      onError: (error) => toast.error('No se pudo guardar', getErrorMessage(error)),
    });
  };

  const handleReset = () => {
    resetDatabase();
    setConfirmReset(false);
    toast.success('Datos restaurados', 'El catálogo de demostración vuelve a su estado inicial.');
    window.location.reload();
  };

  const watchedCurrency = watch('currency');

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configuración"
        description="Preferencias generales del sistema y datos de conexión"
        breadcrumbs={[{ label: 'Administración' }, { label: 'Configuración' }]}
        actions={
          <Button
            type="submit"
            form="settings-form"
            icon={<Save className="h-4 w-4" />}
            loading={mutation.isPending || isSubmitting}
            disabled={!isDirty}
          >
            Guardar cambios
          </Button>
        }
      />

      <form id="settings-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader title="General" description="Identidad y formato del catálogo" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nombre del sistema" htmlFor="set-app" required error={errors.appName?.message}>
                <Input id="set-app" {...register('appName')} error={errors.appName?.message} />
              </Field>
              <Field
                label="Moneda"
                htmlFor="set-currency"
                required
                error={errors.currency?.message}
                hint={`Se verá como ${formatCurrency(1234567, watchedCurrency)} en todo el sistema`}
              >
                <Select id="set-currency" {...register('currency')} error={errors.currency?.message}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} — {currency.label}
                    </option>
                  ))}
                  {!CURRENCIES.some((currency) => currency.code === watchedCurrency) && (
                    <option value={watchedCurrency}>{watchedCurrency}</option>
                  )}
                </Select>
              </Field>
              <Field label="Zona horaria" htmlFor="set-tz" required error={errors.timezone?.message} className="sm:col-span-2">
                <Select id="set-tz" {...register('timezone')} error={errors.timezone?.message}>
                  {TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </Select>
              </Field>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Inventario" description="Reglas de stock y paginación por defecto" />
            <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Alerta de stock bajo" htmlFor="set-threshold" error={errors.lowStockThreshold?.message} hint="Unidades mínimas">
                <Input id="set-threshold" type="number" min={0} max={100} {...register('lowStockThreshold')} error={errors.lowStockThreshold?.message} />
              </Field>
              <Field label="Tamaño de página" htmlFor="set-page" error={errors.defaultPageSize?.message} hint="Registros por página">
                <Input id="set-page" type="number" min={5} max={200} {...register('defaultPageSize')} error={errors.defaultPageSize?.message} />
              </Field>
              <div className="flex items-end">
                <div className="flex w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Promociones</p>
                    <p className="text-xs text-slate-500">Mostrar precios promocionales</p>
                  </div>
                  <Switch checked={watch('enablePromotions')} onChange={(value) => setValue('enablePromotions', value, { shouldDirty: true })} />
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Apariencia" description="Tema de la interfaz" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Modo oscuro</p>
                    <p className="text-xs text-slate-500">Se guarda en este dispositivo</p>
                  </div>
                </div>
                <Switch checked={theme === 'dark'} onChange={toggleTheme} />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Conexión de datos" description="Origen de los datos del catálogo" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">API REST</span>
                </div>
                <Badge variant={apiUrl ? 'success' : 'warning'}>{apiUrl ? 'Conectada' : 'Mock local'}</Badge>
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                {apiUrl
                  ? `El frontend consume ${apiUrl} (por ejemplo functions de Vercel conectadas a TiDB).`
                  : 'Sin VITE_API_URL la app usa datos de demostración en localStorage. Define VITE_API_URL=/api para usar la API real.'}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Datos de demostración" description="Restablece el catálogo inicial" />
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-danger" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Reiniciar base local</p>
                    <p className="text-xs text-slate-500">Borra cambios locales y regenera el seed</p>
                  </div>
                </div>
              </div>
              <Button type="button" variant="danger" className="w-full" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setConfirmReset(true)}>
                Restaurar datos
              </Button>
            </CardBody>
          </Card>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReset}
        title="¿Restaurar datos de demostración?"
        message="Se descartarán todos los cambios locales (productos, categorías y ventas) y volverá el catálogo inicial."
        confirmLabel="Restaurar"
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
