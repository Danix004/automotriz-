import { useMemo, useState } from 'react';
import { CheckSquare, Square, CarFront } from 'lucide-react';
import type { VehicleWithRefs } from '@/types';
import { VehicleSelector, type VehicleSelection } from '@/components/shared/VehicleSelector';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/States';
import { cn } from '@/utils/cn';

export interface CompatibilitySelectorProps {
  /** IDs de vehículos seleccionados. */
  value: string[];
  onChange: (vehicleIds: string[]) => void;
  disabled?: boolean;
}

/**
 * Selector de compatibilidad en cascada:
 * Marca → Modelo → Generación (+ rango de años) → lista de vehículos a asociar.
 * Soporta la relación Marca → Modelo → Generación → Año → Versión.
 */
export function CompatibilitySelector({ value, onChange, disabled = false }: CompatibilitySelectorProps) {
  const [selection, setSelection] = useState<VehicleSelection>({
    brandId: '',
    modelId: '',
    generationId: '',
    year: '',
    vehicleId: '',
  });
  const [loaded, setLoaded] = useState<VehicleWithRefs[]>([]);
  const [fromYear, setFromYear] = useState('');
  const [toYear, setToYear] = useState('');

  const candidates = useMemo(() => {
    let items = loaded;
    if (fromYear) items = items.filter((vehicle) => vehicle.year >= Number(fromYear));
    if (toYear) items = items.filter((vehicle) => vehicle.year <= Number(toYear));
    return [...items].sort((a, b) => b.year - a.year || a.version.localeCompare(b.version, 'es'));
  }, [loaded, fromYear, toYear]);

  const selected = useMemo(() => new Set(value), [value]);
  const allSelected = candidates.length > 0 && candidates.every((vehicle) => selected.has(vehicle.id));

  const toggle = (vehicleId: string) => {
    const next = new Set(selected);
    if (next.has(vehicleId)) next.delete(vehicleId);
    else next.add(vehicleId);
    onChange([...next]);
  };

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) candidates.forEach((vehicle) => next.delete(vehicle.id));
    else candidates.forEach((vehicle) => next.add(vehicle.id));
    onChange([...next]);
  };

  return (
    <div className="space-y-4">
      <VehicleSelector
        value={selection}
        onChange={(next) => {
          setSelection(next);
          setFromYear('');
          setToYear('');
        }}
        onVehiclesLoaded={setLoaded}
        showVersion={false}
        columns={3}
        disabled={disabled}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Desde año" htmlFor="compat-from">
          <Input
            id="compat-from"
            type="number"
            min={1950}
            max={2100}
            placeholder="2016"
            value={fromYear}
            disabled={disabled || !selection.generationId}
            onChange={(event) => setFromYear(event.target.value)}
          />
        </Field>
        <Field label="Hasta año" htmlFor="compat-to">
          <Input
            id="compat-to"
            type="number"
            min={1950}
            max={2100}
            placeholder="2024"
            value={toYear}
            disabled={disabled || !selection.generationId}
            onChange={(event) => setToYear(event.target.value)}
          />
        </Field>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={toggleAll}
            disabled={disabled || candidates.length === 0}
          >
            {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo el rango'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Vehículos disponibles
          </p>
          <span className="text-xs text-slate-400">
            {candidates.length} encontrados · {selected.size} seleccionados
          </span>
        </div>

        <div className="max-h-72 overflow-y-auto p-2">
          {candidates.length === 0 ? (
            <EmptyState
              icon={<CarFront className="h-6 w-6" />}
              className="py-10"
              title="Selecciona una generación"
              description="Elige marca, modelo y generación para listar los vehículos compatibles."
            />
          ) : (
            <ul className="space-y-1">
              {candidates.map((vehicle) => {
                const checked = selected.has(vehicle.id);
                return (
                  <li key={vehicle.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggle(vehicle.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                        checked ? 'bg-primary/10 text-primary' : 'hover:bg-white dark:hover:bg-slate-700/50',
                      )}
                    >
                      {checked ? (
                        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 shrink-0 text-slate-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="font-medium">
                          {vehicle.brand?.name} {vehicle.model?.name}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">
                          {vehicle.year} · {vehicle.version} · {vehicle.engine}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
