import { Link } from 'react-router-dom';
import { Calendar, Cog, Fuel, Gauge, Settings2, Zap } from 'lucide-react';
import type { VehicleWithRefs } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { paths } from '@/routes/paths';
import { cn } from '@/utils/cn';

export interface VehicleCardProps {
  vehicle: VehicleWithRefs;
  compatibilityCount?: number;
  className?: string;
  compact?: boolean;
}

/** Tarjeta de vehículo usada en listados, buscador y recomendaciones. */
export function VehicleCard({ vehicle, compatibilityCount, className, compact }: VehicleCardProps) {
  return (
    <Link
      to={paths.vehicle(vehicle.id)}
      className={cn(
        'group block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70',
        'shadow-card dark:shadow-card-dark transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg',
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-4">
        <Badge variant="primary">{vehicle.year}</Badge>
        {vehicle.generation?.name && <Badge variant="neutral">{vehicle.generation.name}</Badge>}
        {!vehicle.active && (
          <span className="ml-auto rounded-md bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">Inactivo</span>
        )}
      </div>

      <div className="space-y-3 px-4 pb-4 pt-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-primary">{vehicle.brand?.name}</p>
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {vehicle.model?.name} <span className="font-normal text-slate-500 dark:text-slate-400">{vehicle.version}</span>
          </h3>
        </div>

        {!compact && (
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 truncate">
              <Cog className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {vehicle.engine}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {vehicle.power} hp
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {vehicle.fuel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {vehicle.transmission}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Calendar className="h-3.5 w-3.5" />
            {vehicle.bodyType} · {vehicle.drivetrain}
          </span>
          {typeof compatibilityCount === 'number' && (
            <span className="font-semibold text-primary">{compatibilityCount} accesorios</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Fila compacta para tablas y listas. */
export function VehicleRow({ vehicle, action }: { vehicle: VehicleWithRefs; action?: React.ReactNode }) {
  const title = `${vehicle.brand?.name ?? ''} ${vehicle.model?.name ?? ''}`.trim();
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {title} <span className="text-slate-500">{vehicle.year}</span>
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
          {vehicle.version} · {vehicle.engine}
        </p>
      </div>
      {action}
    </div>
  );
}

export function VehicleSpecGrid({ vehicle }: { vehicle: VehicleWithRefs }) {
  const items = [
    { icon: Calendar, label: 'Año', value: String(vehicle.year) },
    { icon: Gauge, label: 'Potencia', value: `${vehicle.power} hp` },
    { icon: Cog, label: 'Motor', value: vehicle.engine },
    { icon: Fuel, label: 'Combustible', value: vehicle.fuel },
    { icon: Settings2, label: 'Transmisión', value: vehicle.transmission },
    { icon: Zap, label: 'Tracción', value: vehicle.drivetrain },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3"
        >
          <dt className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-slate-400">
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </dt>
          <dd className="mt-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
